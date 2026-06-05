import { test, expect } from "@playwright/test";

test.describe("Gestión de flota", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fleet");
    await expect(page.getByText("AB-123-CD")).toBeVisible();
  });

  // TC-701
  test("TC-701: muestra los 4 camiones semilla con sus estados", async ({ page }) => {
    await expect(page.getByText("EF-456-GH")).toBeVisible();
    await expect(page.getByText("IJ-789-KL")).toBeVisible();
    await expect(page.getByText("MN-012-OP")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Activos", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inactivos", exact: true })).toBeVisible();
  });

  // TC-710 — only one "Activar camión" button since only MN-012-OP is inactive
  test("TC-710: activa un camión inactivo", async ({ page }) => {
    await page.getByTitle("Activar camión", { exact: true }).click();
    await expect(page.getByText("MN-012-OP")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inactivos", exact: true })).toBeHidden();
  });
});

test.describe("Registro de nuevo camión", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fleet/new");
  });

  // TC-702
  test("TC-702: registra un nuevo camión y aparece en la flota", async ({ page }) => {
    await page.getByLabel("Patente / Matrícula").fill("XY-999-ZA");
    await page.getByLabel("Capacidad máxima").fill("25");
    await page.getByLabel("Consumo de combustible").fill("0.40");

    await page.getByRole("button", { name: "Registrar camión" }).click();

    await expect(page).toHaveURL("/fleet");
    await expect(page.getByText("XY-999-ZA")).toBeVisible();
  });

  // TC-703
  test("TC-703: muestra error 409 para patente duplicada", async ({ page }) => {
    await page.getByLabel("Patente / Matrícula").fill("AB-123-CD");
    await page.getByLabel("Capacidad máxima").fill("30");
    await page.getByLabel("Consumo de combustible").fill("0.45");

    await page.getByRole("button", { name: "Registrar camión" }).click();

    await expect(page.getByText("Ya existe un camión con esa patente")).toBeVisible();
    await expect(page).toHaveURL("/fleet/new");
  });

  // TC-705
  test("TC-705: rechaza capacidad igual a 0", async ({ page }) => {
    await page.getByLabel("Patente / Matrícula").fill("ZZ-000-ZZ");
    await page.getByLabel("Capacidad máxima").fill("0");
    await page.getByLabel("Consumo de combustible").fill("0.45");

    await page.getByRole("button", { name: "Registrar camión" }).click();

    await expect(page).toHaveURL("/fleet/new");
  });
});
