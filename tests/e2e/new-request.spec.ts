import { test, expect } from "@playwright/test";

test.describe("Creación de solicitud de transporte", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("request-card").first()).toBeVisible();
    await page.getByRole("button", { name: "Nueva solicitud" }).first().click();
    await expect(page.getByRole("heading", { name: "Nueva Solicitud" })).toBeVisible();
  });

  // TC-201
  test("TC-201: crea una solicitud completa y aparece en el dashboard", async ({ page }) => {
    await page.getByLabel("Nombre del solicitante").fill("Pedro López");
    await page.getByLabel("Teléfono de contacto").fill("1155550000");
    await page.getByLabel("Cabezas de ganado").fill("10");
    await page.getByLabel("Origen").fill("Rosario, Santa Fe");
    await page.getByLabel("Destino").fill("Buenos Aires");

    await page.getByRole("button", { name: "Crear solicitud" }).click();

    await expect(page.getByRole("heading", { name: "Nueva Solicitud" })).toBeHidden();
    await expect(page.getByText("Pedro López")).toBeVisible();
  });

  // TC-202
  test("TC-202: crea solicitud sin teléfono", async ({ page }) => {
    await page.getByLabel("Nombre del solicitante").fill("Sin Teléfono");
    await page.getByLabel("Cabezas de ganado").fill("5");
    await page.getByLabel("Origen").fill("Mendoza Capital");
    await page.getByLabel("Destino").fill("Córdoba Capital");

    await page.getByRole("button", { name: "Crear solicitud" }).click();

    await expect(page.getByText("Sin Teléfono")).toBeVisible();
  });

  // TC-203
  test("TC-203: muestra error si el nombre está vacío", async ({ page }) => {
    await page.getByLabel("Cabezas de ganado").fill("10");
    await page.getByLabel("Origen").fill("Rosario, Santa Fe");
    await page.getByLabel("Destino").fill("Buenos Aires");

    await page.getByRole("button", { name: "Crear solicitud" }).click();

    await expect(page.getByText("El nombre es requerido")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nueva Solicitud" })).toBeVisible();
  });

  // TC-204
  test("TC-204: rechaza cantidad de cabezas igual a 0", async ({ page }) => {
    await page.getByLabel("Nombre del solicitante").fill("Test");
    await page.getByLabel("Cabezas de ganado").fill("0");
    await page.getByLabel("Origen").fill("Rosario");
    await page.getByLabel("Destino").fill("Córdoba");

    await page.getByRole("button", { name: "Crear solicitud" }).click();

    await expect(page.getByRole("heading", { name: "Nueva Solicitud" })).toBeVisible();
  });

  // TC-209
  test("TC-209: guarda y muestra correctamente nombres con acentos y ñ", async ({ page }) => {
    await page.getByLabel("Nombre del solicitante").fill("José García Ñoño");
    await page.getByLabel("Cabezas de ganado").fill("5");
    await page.getByLabel("Origen").fill("Salta Capital");
    await page.getByLabel("Destino").fill("Tucumán Capital");

    await page.getByRole("button", { name: "Crear solicitud" }).click();

    await expect(page.getByText("José García Ñoño")).toBeVisible();
  });

  test("TC-phone: el campo teléfono formatea mientras se escribe", async ({ page }) => {
    const phoneInput = page.getByLabel("Teléfono de contacto");
    await phoneInput.fill("3415551234");
    await expect(phoneInput).toHaveValue("+54 9 341 555-1234");
  });
});
