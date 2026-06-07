import { test, expect } from "@playwright/test";

test.describe("Dashboard — listado de solicitudes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("request-card").first()).toBeVisible();
  });

  // TC-101
  test("TC-101: muestra las solicitudes semilla con badges correctos", async ({ page }) => {
    await expect(page.getByText("Juan Pérez")).toBeVisible();
    await expect(page.getByText("María González")).toBeVisible();
    await expect(page.getByText("Carlos Rodríguez")).toBeVisible();
    await expect(page.getByText("Ana Martínez")).toBeVisible();
    await expect(page.getByText("Roberto Silva")).toBeVisible();

    await expect(page.getByText("Pendiente").first()).toBeVisible();
    await expect(page.getByText("Asignado").first()).toBeVisible();
    await expect(page.getByText("Completado").first()).toBeVisible();
  });

  // TC-102
  test("TC-102: muestra cards ordenadas (listado no vacío)", async ({ page }) => {
    await expect(page.getByTestId("request-card").first()).toBeVisible();
    expect(await page.getByTestId("request-card").count()).toBeGreaterThan(0);
  });

  // TC-103
  test("TC-103: muestra estado vacío cuando ningún resultado coincide con el filtro", async ({ page }) => {
    await page.getByTestId("search-input").fill("xyzxyzxyz");
    await expect(page.getByText("Sin resultados para los filtros aplicados")).toBeVisible();
  });

  test("filtra por estado PENDING y actualiza la URL", async ({ page }) => {
    await page.getByRole("button", { name: "Pendiente" }).click();
    await expect(page).toHaveURL(/status=PENDING/);
    await expect(page.getByText("Juan Pérez")).toBeVisible();
    await expect(page.getByText("Carlos Rodríguez")).toBeHidden();
  });

  test("limpiar filtros restaura todas las solicitudes", async ({ page }) => {
    await page.getByRole("button", { name: "Completado" }).click();
    await expect(page.getByText("Roberto Silva")).toBeVisible();
    await page.getByText("Limpiar filtros").click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Juan Pérez")).toBeVisible();
  });

  test("infinite scroll: carga página 2 al llegar al fondo", async ({ page }) => {
    await expect(page.getByTestId("request-card").first()).toBeVisible();
    await page.waitForFunction(
      () => document.querySelectorAll("[data-testid='request-card']").length >= 5
    );

    const page2Response = page.waitForResponse(
      (resp) => resp.url().includes("/api/transport-requests") && resp.url().includes("page=2"),
      { timeout: 15000 }
    );

    await page.mouse.move(640, 360);
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 500);
    }

    const resp = await page2Response;
    const json = await resp.json();
    expect(resp.status()).toBe(200);
    expect(json.data.items.length).toBeGreaterThan(0);
    expect(json.data.hasMore).toBe(false);
  });

  test("navegar al detalle y volver preserva los filtros de URL", async ({ page }) => {
    await page.getByRole("button", { name: "Pendiente" }).click();
    await expect(page).toHaveURL(/status=PENDING/);

    await page.getByText("Juan Pérez").click();
    await expect(page).toHaveURL(/\/requests\//);

    await page.goBack();
    await expect(page).toHaveURL(/status=PENDING/);
  });
});
