# 学習ログ

学んだことを日付ごとに記録し、学び方や目標とする姿を振り返るための学習ログアプリです。

> このリポジトリは、学習ログアプリに育てるための土台として使います。

このアプリは、GitHub Pagesで公開している学習ログアプリです。ブラウザからアクセスして、学習日や学んだ内容を手軽に記録できます。

公開ページ: https://r4ict01.github.io/my-study-log/

## デモの動かし方

Live Serverで開かないので、ポートから開きました。

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。

## 記録できる内容

- 学習日
- 科目（国語・算数・社会・理科・音楽・体育・図工・道徳・英語・総合的な学習）
- 本時の課題
- 学び方（一人で学ぶ・友だちと学ぶ・先生と学ぶ）
- 目標とする姿
- 単元を通した振り返り
- 次にやること

学習ログは日付ごとに1件保存され、同じ日付で保存すると更新されます。科目や内容の検索、科目フィルター、学び方の集計、目標とする姿の平均にも対応しています。

## 使用技術

- HTML
- CSS
- JavaScript
- localStorage

外部ライブラリは使っていません。

## Googleスプレッドシートへの保存

Google Apps ScriptのウェブアプリURLを `app.js` の `GOOGLE_SHEETS_URL` に設定すると、「学習ログを保存」したときに、その記録をGoogleスプレッドシートへ追加できます。URLが空の場合は、これまでどおりブラウザ内への保存だけを行います。

Apps Scriptでは、次のコードを使います。スプレッドシートの「拡張機能」→「Apps Script」を開き、貼り付けてください。

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.date,
    data.subject,
    data.task,
    data.learningMethod,
    data.understanding,
    data.content,
    data.nextAction || "",
    new Date(),
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Apps Scriptをウェブアプリとしてデプロイし、発行されたURLを `GOOGLE_SHEETS_URL` に設定してください。送信先のスプレッドシートには、個人情報を入力しないでください。

## localStorage

保存キーは `my-study-log.entries.v1` です。既存の「かんたん日記」データとは別の保存領域を使うため、日記データを上書きしません。

このアプリでは、氏名・メールアドレス・住所などの個人情報を入力する項目を設けていません。学習内容にも個人情報を入力しないでください。

## ファイル構成

- `index.html`: 学習ログ画面の構造
- `styles.css`: 学習記録向けの配色とレイアウト
- `app.js`: 保存、表示、編集、削除、検索、集計
- `README.md`: この説明ファイル
- `LICENSE`: MITライセンス

## ライセンス

MIT License
