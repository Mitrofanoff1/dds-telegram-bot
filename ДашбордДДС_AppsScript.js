/**
 * Скрипт создания листа "ДАШБОРД" в таблице ДДС.
 * Данные берутся с листа "ДДС: Сводный".
 *
 * Как использовать:
 * 1. Откройте вашу Google-таблицу ДДС.
 * 2. Расширения → Apps Script.
 * 3. Вставьте этот код в файл (например, Code.gs).
 * 4. Сохраните, нажмите "Выполнить" (запустите функцию createDashboard).
 * 5. При первом запуске разрешите доступ к таблице.
 * 6. Лист "ДАШБОРД" будет создан или обновлён.
 */

const CONFIG = {
  sheetNameSummary: 'ДДС: Сводный',
  sheetNameDashboard: 'ДАШБОРД',
  rowTotalEndOfMonth: 219,      // строка "Деньги на конец месяца" (итого)
  rowWalletsStart: 220,         // первая строка кошельков
  rowWalletsEnd: 231,           // последняя строка кошельков (до 12)
  rowRevenue: 16,               // строка "Поступления от оказания услуг"
  colMonthsStart: 2,           // столбец B = месяц 1
  colMonthsEnd: 13,             // столбец M = месяц 12
};

/**
 * Создаёт или обновляет лист дашборда.
 */
function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName(CONFIG.sheetNameSummary);
  if (!summarySheet) {
    SpreadsheetApp.getUi().alert('Лист "' + CONFIG.sheetNameSummary + '" не найден.');
    return;
  }

  let dashboard = ss.getSheetByName(CONFIG.sheetNameDashboard);
  if (!dashboard) {
    dashboard = ss.insertSheet(CONFIG.sheetNameDashboard);
  } else {
    dashboard.clear();
  }

  // Заголовок
  dashboard.getRange('A1').setValue('Баланс денежных средств');
  dashboard.getRange('A1:B1').merge();
  dashboard.getRange('A1').setFontSize(14).setFontWeight('bold');

  // --- Блок: сегодня и общий остаток ---
  dashboard.getRange('A2').setValue('Сегодня:');
  dashboard.getRange('B2').setFormula('=TODAY()');
  dashboard.getRange('B2').setNumberFormat('dd.mm.yyyy');

  dashboard.getRange('A3').setValue('Текущий остаток денежных средств:');
  dashboard.getRange('B3').setFormula(
    "=INDEX('" + CONFIG.sheetNameSummary + "'!$B$" + CONFIG.rowTotalEndOfMonth + ":$M$" + CONFIG.rowTotalEndOfMonth + "; 1; MONTH(TODAY()))"
  );
  dashboard.getRange('B3').setNumberFormat('#,##0.00');
  dashboard.getRange('A3:B3').setFontWeight('bold');

  // --- Таблица кошельков: названия с листа "ДДС: Сводный" ---
  const walletNamesRange = summarySheet.getRange(
    CONFIG.rowWalletsStart, 1,
    CONFIG.rowWalletsEnd - CONFIG.rowWalletsStart + 1, 1
  );
  const walletNames = walletNamesRange.getValues().map(function (row) { return row[0]; });
  const walletCount = walletNames.filter(function (v) { return v !== null && String(v).trim() !== ''; }).length;

  const dashboardWalletStartRow = 5;
  dashboard.getRange('A4').setValue('Кошелёк');
  dashboard.getRange('B4').setValue('Баланс на конец месяца');
  dashboard.getRange('A4:B4').setFontWeight('bold');

  const walletEndRow = dashboardWalletStartRow + Math.max(walletCount, 1) - 1;
  for (var i = 0; i < walletNames.length; i++) {
    var row = dashboardWalletStartRow + i;
    dashboard.getRange(row, 1).setValue(walletNames[i] || '');
  }

  // Формула баланса по кошелькам (поддержка до 12 кошельков)
  var balanceFormula = "=IF(A5=\"\"; \"\"; INDEX('" + CONFIG.sheetNameSummary + "'!$B$" + CONFIG.rowWalletsStart + ":$M$" + CONFIG.rowWalletsEnd + "; ROW()-" + (dashboardWalletStartRow - 1) + "; MONTH(TODAY())))";
  dashboard.getRange(dashboardWalletStartRow, 2).setFormula(balanceFormula);
  if (walletEndRow > dashboardWalletStartRow) {
    dashboard.getRange(dashboardWalletStartRow, 2).copyTo(
      dashboard.getRange(dashboardWalletStartRow + 1, 2, walletEndRow, 2),
      SpreadsheetApp.CopyPasteType.PASTE_FORMULA,
      false
    );
  }
  dashboard.getRange(dashboardWalletStartRow, 2, walletEndRow, 2).setNumberFormat('#,##0.00');

  // --- Выручка по месяцам (блок под таблицей кошельков) ---
  const revenueHeaderRow = walletEndRow + 2;
  const revenueDataRow = revenueHeaderRow + 1;
  const monthColStart = 4; // D
  const monthColEnd = 15;   // O (12 месяцев)

  dashboard.getRange('A' + revenueHeaderRow).setValue('Выручка по месяцам:');
  dashboard.getRange('A' + revenueHeaderRow).setFontWeight('bold');
  for (var c = 0; c < 12; c++) {
    dashboard.getRange(revenueHeaderRow, monthColStart + c).setValue(c + 1);
  }
  dashboard.getRange(revenueHeaderRow, monthColStart, revenueHeaderRow, monthColEnd).setFontWeight('bold');

  var revenueFormula = "=IFERROR(INDEX('" + CONFIG.sheetNameSummary + "'!$B$" + CONFIG.rowRevenue + ":$M$" + CONFIG.rowRevenue + "; 1; COLUMN()-" + (monthColStart - 1) + "); 0)";
  dashboard.getRange(revenueDataRow, monthColStart).setFormula(revenueFormula);
  dashboard.getRange(revenueDataRow, monthColStart).copyTo(
    dashboard.getRange(revenueDataRow, monthColStart + 1, revenueDataRow, monthColEnd),
    SpreadsheetApp.CopyPasteType.PASTE_FORMULA,
    false
  );
  dashboard.getRange(revenueDataRow, monthColStart, revenueDataRow, monthColEnd).setNumberFormat('#,##0.00');

  // --- График 1: баланс по кошелькам (столбчатая) ---
  const chart1DataRows = walletCount > 0 ? walletEndRow : dashboardWalletStartRow;
  const chartAnchorRow = walletEndRow + 5;
  var chart1 = dashboard.newChart()
    .asColumnChart()
    .addRange(dashboard.getRange('A4:B' + chart1DataRows))
    .setOption('title', 'Распределение денежных средств по счетам')
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', { title: 'Кошелёк' })
    .setOption('vAxis', { title: 'Сумма' })
    .setNumHeaders(1)
    .setPosition(chartAnchorRow, 1, 0, 0)
    .setOption('width', 420)
    .setOption('height', 280)
    .build();
  dashboard.insertChart(chart1);

  // --- График 2: выручка по месяцам (линейный) ---
  var chart2 = dashboard.newChart()
    .asLineChart()
    .addRange(dashboard.getRange(revenueHeaderRow, monthColStart, revenueDataRow, monthColEnd))
    .setOption('title', 'Выручка по месяцам (распределение поступлений)')
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', { title: 'Месяц' })
    .setOption('vAxis', { title: 'Сумма' })
    .setNumHeaders(1)
    .setPosition(chartAnchorRow, 4, 0, 0)
    .setOption('width', 420)
    .setOption('height', 280)
    .build();
  dashboard.insertChart(chart2);

  // Ширина столбцов
  dashboard.setColumnWidth(1, 180);
  dashboard.setColumnWidth(2, 160);
  dashboard.setColumnWidth(3, 120);

  SpreadsheetApp.getUi().alert('Дашборд создан на листе "' + CONFIG.sheetNameDashboard + '".');
}

/**
 * Пункт меню для дашборда добавляйте в ВАШ существующий onOpen() (в файле с ботом).
 * В том onOpen(), где вы создаёте меню, добавьте одну строку:
 *
 *   .addItem('Создать / обновить дашборд', 'createDashboard')
 *
 * в нужное меню (или создайте подменю "Дашборд ДДС" с этим пунктом).
 * Отдельный onOpen() здесь не нужен — в проекте может быть только один onOpen().
 */
