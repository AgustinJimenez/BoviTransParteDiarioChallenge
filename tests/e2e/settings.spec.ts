import { test, expect } from "@playwright/test";

test.describe("Configuración — precio de combustible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  // TC-801
  test("TC-801: muestra el precio semilla de $1250", async ({ page }) => {
    await expect(page.getByLabel("Precio de combustible ($ por litro)")).toHaveValue("1250");
  });

  // TC-802
  test("TC-802: actualiza el precio y muestra confirmación", async ({ page }) => {
    const input = page.getByLabel("Precio de combustible ($ por litro)");
    await input.click({ clickCount: 3 });
    await input.fill("1500");

    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Precio actualizado correctamente")).toBeVisible();
    await expect(input).toHaveValue("1500");
  });

  // TC-803
  test("TC-803: rechaza precio igual a 0", async ({ page }) => {
    const input = page.getByLabel("Precio de combustible ($ por litro)");
    await input.click({ clickCount: 3 });
    await input.fill("0");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Precio actualizado correctamente")).toBeHidden();
  });

  // TC-806
  test("TC-806: acepta precio muy alto sin error", async ({ page }) => {
    const input = page.getByLabel("Precio de combustible ($ por litro)");
    await input.click({ clickCount: 3 });
    await input.fill("999999");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Precio actualizado correctamente")).toBeVisible();
  });
});
