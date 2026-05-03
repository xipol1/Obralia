import { expect, test } from '@playwright/test'

// E2E del flujo crítico: registro → onboarding → crear cliente → crear presupuesto → generar PDF
// Requiere Supabase local corriendo con SMS OTP en modo test (auto-confirm)

test.describe('Flujo completo de presupuesto', () => {
  test.skip(
    !process.env.E2E_TEST_PHONE,
    'Requiere E2E_TEST_PHONE y Supabase local con auto-confirm',
  )

  const phone = process.env.E2E_TEST_PHONE || '+34600000000'
  const otp = process.env.E2E_TEST_OTP || '123456'

  test('registro → onboarding → cliente → presupuesto → PDF', async ({ page }) => {
    // 1. Login con teléfono
    await page.goto('/login')
    await expect(page.getByText('Accede con tu móvil')).toBeVisible()
    await page.getByPlaceholder(/teléfono/i).fill(phone)
    await page.getByRole('button', { name: /enviar código/i }).click()

    // 2. Verificar OTP
    await expect(page).toHaveURL(/verificar/)
    await page.getByPlaceholder(/código/i).fill(otp)
    await page.getByRole('button', { name: /verificar/i }).click()

    // 3. Onboarding - Datos empresa
    await expect(page).toHaveURL(/onboarding/)
    await page.getByLabel(/razón social/i).fill('Test Reformas S.L.')
    await page.getByLabel(/nif/i).fill('B12345678')
    await page.getByLabel(/dirección/i).fill('Calle Test 1')
    await page.getByLabel(/código postal/i).fill('28001')
    await page.getByLabel(/municipio/i).fill('Madrid')
    await page.getByLabel(/provincia/i).fill('Madrid')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // 4. Onboarding - Logo (saltar)
    await expect(page).toHaveURL(/logo/)
    await page.getByRole('link', { name: /saltar/i }).click()

    // 5. Onboarding - Trial
    await expect(page).toHaveURL(/plan/)
    await page.getByRole('button', { name: /empezar prueba/i }).click()

    // 6. Llega a presupuestos (vacío)
    await expect(page).toHaveURL(/presupuestos/)
    await expect(page.getByText(/aún no tienes presupuestos/i)).toBeVisible()

    // 7. Crear cliente
    await page.getByRole('link', { name: /clientes/i }).click()
    await page.getByRole('link', { name: /nuevo cliente/i }).click()
    await page.getByRole('button', { name: /particular/i }).click()
    await page.getByLabel(/nombre/i).fill('María')
    await page.getByLabel(/apellidos/i).fill('García')
    await page.getByLabel(/teléfono/i).fill('+34611111111')
    await page.getByRole('button', { name: /guardar/i }).click()
    await expect(page.getByText('María')).toBeVisible()

    // 8. Crear presupuesto
    await page.getByRole('link', { name: /presupuestos/i }).first().click()
    await page.locator('a[href="/presupuestos/nuevo"]').first().click()

    // Seleccionar cliente
    await page.getByLabel(/cliente/i).selectOption({ label: 'María García' })

    // Datos presupuesto
    await page.getByLabel(/título/i).fill('Reforma baño test')

    // IVA wizard
    await page.getByLabel(/vivienda particular/i).getByText('Sí').click()
    await page.getByLabel(/residencia habitual/i).getByText('Sí').click()
    await page.getByLabel(/materiales.*40/i).getByText('No').click()
    await expect(page.getByText(/10%/)).toBeVisible()

    // Añadir partida
    await page.getByPlaceholder(/descripción/i).first().fill('Alicatado baño')
    await page.locator('input[name*="cantidad"]').first().fill('12')
    await page.locator('input[name*="precio_unitario"]').first().fill('42')

    // Guardar
    await page.getByRole('button', { name: /guardar borrador/i }).click()

    // 9. Vista detalle
    await expect(page.getByText('Reforma baño test')).toBeVisible()
    await expect(page.getByText('borrador')).toBeVisible()

    // 10. Generar PDF
    await page.getByRole('button', { name: /generar pdf/i }).click()
    await expect(page.getByText(/pdf generado/i)).toBeVisible({ timeout: 15000 })

    // 11. Verificar botón WhatsApp aparece
    await expect(page.getByRole('link', { name: /whatsapp/i })).toBeVisible()
  })
})
