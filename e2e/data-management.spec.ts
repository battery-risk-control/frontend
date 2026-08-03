import { test, expect, type Page } from '@playwright/test'
import { loginAs } from './utils'

/**
 * 1계층 구매팀 "데이터 관리"의 ERP CSV 흐름 검증: 업로드 → 내용 분석(DB 미반영) → DB 반영.
 *
 * **실 백엔드(localhost:8080)가 떠 있어야 한다.** 다른 스펙과 같은 전제다(loginAs가 이미 실 API를
 * 부른다). 화면이 mock 폴백 없이 실제 검증 결과만 보여주므로, 백엔드 없이는 이 시나리오 자체가
 * 성립하지 않는다.
 *
 * 반영 단계에 **시드에 이미 있는 자재 2건**을 쓴다. upsert라 갱신 0→2건으로 끝나고 행이 늘지
 * 않는다 — e2e가 돌 때마다 DB에 찌꺼기가 쌓이면 다음 실행의 "중복" 판정이 달라진다.
 */
const HEADER =
  'material_id,material_code,material_name,material_category,base_unit,criticality,active,erp_group_code,created_at,updated_at'

const EXISTING_MATERIALS = [
  HEADER,
  'MAT-LI-CARB,RM-LI-001,Lithium Carbonate,LITHIUM,KG,HIGH,true,BATT-01,2024-08-01T00:00:00+09:00,2026-07-21T00:00:00+09:00',
  'MAT-LI-OH,RM-LI-002,Lithium Hydroxide,LITHIUM,KG,HIGH,true,BATT-02,2024-08-01T00:00:00+09:00,2026-07-21T00:00:00+09:00',
  '',
].join('\n')

/** active에 불리언이 아닌 값 + 같은 키가 두 번 → 오류 1건, 중복 1건. */
const BROKEN_MATERIALS = [
  HEADER,
  'MAT-LI-CARB,RM-LI-001,Lithium Carbonate,LITHIUM,KG,HIGH,maybe,BATT-01,2024-08-01T00:00:00+09:00,2026-07-21T00:00:00+09:00',
  'MAT-LI-CARB,RM-LI-002,Lithium Carbonate,LITHIUM,KG,HIGH,true,BATT-01,2024-08-01T00:00:00+09:00,2026-07-21T00:00:00+09:00',
  '',
].join('\n')

async function openDataManagement(page: Page) {
  await loginAs(page, 'purchasing@test.local')
  await expect(page).toHaveURL(/\/purchasing$/)
  await page.getByRole('link', { name: '데이터 관리' }).click()
  await expect(page).toHaveURL(/\/purchasing\/data-management$/)
}

/** 드롭존의 file input은 숨겨져 있다(클릭으로만 열린다) — 파일은 input에 직접 넣는다. */
async function attachCsv(page: Page, name: string, body: string) {
  await page.locator('main input[type=file]').setInputFiles({
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from(body, 'utf-8'),
  })
}

test('ERP CSV를 올려 내용 분석 후 DB에 반영한다', async ({ page }) => {
  await openDataManagement(page)

  // 1단계: 파일 없이는 분석할 수 없고, 반영 버튼도 잠겨 있다.
  await expect(page.getByRole('button', { name: '내용 분석' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'DB에 반영' })).toBeDisabled()
  await expect(page.getByText('먼저 내용 분석을 실행해 주세요.')).toBeVisible()

  await attachCsv(page, '01_materials.csv', EXISTING_MATERIALS)
  await expect(page.getByText('01_materials.csv')).toBeVisible()

  // 2단계: 분석은 DB를 건드리지 않는다.
  await page.getByRole('button', { name: '내용 분석' }).click()
  await expect(page.getByRole('heading', { name: '2. 데이터 검증 결과' })).toBeVisible()
  await expect(page.getByText('DB에는 아직 아무것도 반영되지 않았습니다')).toBeVisible()

  // 파일이 자재 마스터로 판별된다.
  const row = page.getByRole('row').filter({ hasText: '01_materials.csv' })
  await expect(row.getByText('자재 마스터')).toBeVisible()

  // 3단계: 실제로 읽힌 값과, 적재되지 않는 컬럼이 드러난다.
  await expect(page.getByText('MAT-LI-CARB').first()).toBeVisible()
  await expect(page.getByText('실제로 읽힌 값 2행 (전체 2행 중 앞부분)')).toBeVisible()
  await expect(page.getByText('이 컬럼은 적재되지 않고 무시됩니다.').first()).toBeVisible()

  // 우측 요약: 자재 마스터 2건이 들어갈 예정.
  const summary = page.getByRole('complementary', { name: '반영 요약' })
  await expect(summary.getByText('반영 예정 건수')).toBeVisible()
  await expect(summary.getByRole('listitem').filter({ hasText: '자재 마스터' })).toContainText('2')

  // 4단계: 오류가 없으므로 반영이 열린다. 같은 행이라 갱신만 일어난다.
  const commit = page.getByRole('button', { name: 'DB에 반영' })
  await expect(commit).toBeEnabled()
  await commit.click()
  await expect(page.getByText('반영 완료')).toBeVisible()
  await expect(page.getByText('신규 0건 · 갱신 2건')).toBeVisible()
})

test('오류가 있는 CSV는 반영 버튼이 잠긴다', async ({ page }) => {
  await openDataManagement(page)
  await attachCsv(page, '01_materials.csv', BROKEN_MATERIALS)
  await page.getByRole('button', { name: '내용 분석' }).click()

  await expect(page.getByRole('heading', { name: '2. 데이터 검증 결과' })).toBeVisible()
  await expect(page.getByText('true/false 형식이 아닙니다: "maybe"')).toBeVisible()
  await expect(page.getByText('같은 파일 안에 중복된 키입니다: MAT-LI-CARB')).toBeVisible()

  await expect(page.getByRole('button', { name: 'DB에 반영' })).toBeDisabled()
  await expect(
    page.getByText('오류가 남아 있어 반영할 수 없습니다. 파일을 수정하고 다시 분석해 주세요.'),
  ).toBeVisible()
})

test('파일을 바꾸면 이전 분석 결과를 버린다', async ({ page }) => {
  await openDataManagement(page)
  await attachCsv(page, '01_materials.csv', EXISTING_MATERIALS)
  await page.getByRole('button', { name: '내용 분석' }).click()
  await expect(page.getByRole('heading', { name: '2. 데이터 검증 결과' })).toBeVisible()

  // 파일을 지우면 검증 결과가 함께 사라져야 한다 — 남아 있으면 A의 결과를 보며 B를 반영하게 된다.
  await page.getByRole('button', { name: '01_materials.csv 제거' }).click()
  await expect(page.getByRole('heading', { name: '2. 데이터 검증 결과' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'DB에 반영' })).toBeDisabled()
})
