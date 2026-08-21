/**
 * Дашборд ДДС — баланс по кошелькам и др.
 * Два листа:
 * 1. Технический лист (дашборд) — все данные для графиков (дата, суммы, таблицы).
 * 2. ДАШБОРД — только графики, данные подтягиваются с технического листа.
 *
 * Источник данных: лист "ДДС: месяц", блок B1:I3.
 */

const CONFIG = {
  sheetNameMonth: 'ДДС: месяц',
  /** Лист с данными для всех графиков (можно скрыть). */
  sheetNameData: 'Технический лист (дашборд)',
  /** Лист только с графиками. */
  sheetNameDashboard: 'ДАШБОРД',
};

/** Порядок 12 слотов: [row 0-based, col name, col balance] по документу B1,C1 → B2,C2 → B3,C3 → D1,E1 → … → H3,I3 */
var SLOTS = [
  [0, 0, 1],   // B1, C1
  [1, 0, 1],   // B2, C2
  [2, 0, 1],   // B3, C3
  [0, 2, 3],   // D1, E1
  [1, 2, 3],   // D2, E2
  [2, 2, 3],   // D3, E3
  [0, 4, 5],   // F1, G1
  [1, 4, 5],   // F2, G2
  [2, 4, 5],   // F3, G3
  [0, 6, 7],   // H1, I1
  [1, 6, 7],   // H2, I2
  [2, 6, 7],   // H3, I3
];

/**
 * Читает балансы из "ДДС: месяц" (B1:I3), возвращает массив { name, balance } только для занятых кошельков.
 * Слот считается свободным, если название пустое или только цифра 1–12.
 */
function getWalletsFromMonthSheet(monthSheet) {
  var data = monthSheet.getRange('B1:I3').getValues();
  var wallets = [];
  var name, balance, num;

  for (var i = 0; i < SLOTS.length; i++) {
    name = data[SLOTS[i][0]][SLOTS[i][1]];
    if (name === null || name === undefined) name = '';
    name = String(name).trim();

    if (name === '') continue;
    if (/^([1-9]|1[0-2])$/.test(name)) continue; // слот свободен (цифра 1–12)

    balance = data[SLOTS[i][0]][SLOTS[i][2]];
    if (typeof balance === 'number' && !isNaN(balance)) {
      num = balance;
    } else if (typeof balance === 'string') {
      num = parseFloat(balance.replace(/\s/g, '').replace(',', '.')) || 0;
    } else {
      num = 0;
    }
    wallets.push({ name: name, balance: num });
  }
  return wallets;
}

/**
 * Создаёт или обновляет оба листа: данные на "Технический лист (дашборд)", графики на "ДАШБОРД".
 */
function createDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var monthSheet = ss.getSheetByName(CONFIG.sheetNameMonth);
  if (!monthSheet) {
    SpreadsheetApp.getUi().alert('Лист "' + CONFIG.sheetNameMonth + '" не найден.');
    return;
  }

  var wallets = getWalletsFromMonthSheet(monthSheet);

  // --- Лист с данными: "Технический лист (дашборд)" ---
  var dataSheet = ss.getSheetByName(CONFIG.sheetNameData);
  if (!dataSheet) {
    dataSheet = ss.insertSheet(CONFIG.sheetNameData);
  } else {
    dataSheet.clear();
  }

  var dataRowStart = 5;
  dataSheet.getRange('A1').setValue('Сегодня:');
  dataSheet.getRange('B1').setFormula('=TODAY()');
  dataSheet.getRange('B1').setNumberFormat('dd.mm.yyyy');

  dataSheet.getRange('A2').setValue('Текущий остаток денежных средств:');
  if (wallets.length > 0) {
    dataSheet.getRange('B2').setFormula(
      '=SUM(B5:B' + (4 + wallets.length) + ')'
    );
  } else {
    dataSheet.getRange('B2').setValue(0);
  }
  dataSheet.getRange('B2').setNumberFormat('#,##0.00');
  dataSheet.getRange('A2:B2').setFontWeight('bold');

  dataSheet.getRange('A4').setValue('Кошелёк');
  dataSheet.getRange('B4').setValue('Баланс');
  dataSheet.getRange('A4:B4').setFontWeight('bold');

  var numRows = wallets.length;
  if (numRows > 0) {
    var data = [];
    for (var i = 0; i < numRows; i++) {
      data.push([wallets[i].name, wallets[i].balance]);
    }
    var range = dataSheet.getRange(dataRowStart, 1, numRows, 2);
    range.setValues(data);
    dataSheet.getRange(dataRowStart, 2, numRows, 1).setNumberFormat('#,##0.00');
  } else {
    dataSheet.getRange(dataRowStart, 1).setValue('');
    dataSheet.getRange(dataRowStart, 2).setValue(0);
  }

  dataSheet.setColumnWidth(1, 200);
  dataSheet.setColumnWidth(2, 140);

  var chartDataLastRow = numRows > 0 ? dataRowStart + numRows - 1 : dataRowStart;

  // --- Лист только с графиками: "ДАШБОРД" ---
  var dashboard = ss.getSheetByName(CONFIG.sheetNameDashboard);
  if (!dashboard) {
    dashboard = ss.insertSheet(CONFIG.sheetNameDashboard);
  } else {
    dashboard.clear();
  }

  // График 1: распределение по кошелькам (данные с технического листа)
  var chart1 = dashboard.newChart()
    .asColumnChart()
    .addRange(dataSheet.getRange('A4:B' + chartDataLastRow))
    .setOption('title', 'Распределение денежных средств по счетам')
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', { title: 'Кошелёк' })
    .setOption('vAxis', { title: 'Сумма' })
    .setNumHeaders(1)
    .setPosition(1, 1, 0, 0)
    .setOption('width', 500)
    .setOption('height', 320)
    .build();
  dashboard.insertChart(chart1);

  SpreadsheetApp.getUi().alert(
    'Дашборд обновлён.\n• Данные: "' + CONFIG.sheetNameData + '"\n• Графики: "' + CONFIG.sheetNameDashboard + '"'
  );
}
