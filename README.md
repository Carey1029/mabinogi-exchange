# 瑪奇物資兌換手冊

依「地區 → NPC → 兌換物品 → 所需資源」整理的 Mabinogi 兌換路線查詢網頁。
可用「兌換物品」或「所需資源」兩種方式查詢，並會自動比對連動兌換鏈（例如 A 材料本身也需要先兌換 B 材料）。

這個資料夾就是完整的網站，**放到 GitHub 上開啟 GitHub Pages 就能讓其他人一起查詢**，
之後你只要更新 `data.xlsx`，網頁資料就會自動跟著換新，不需要重寫任何程式碼。

---

## 檔案說明

```
maple-sim/
├─ index.html                     ← 網頁主頁面
├─ style.css                      ← 瑪奇風格樣式
├─ app.js                         ← 查詢互動邏輯
├─ data.xlsx                      ← 你的原始 Excel（之後更新資料只要換這個檔）
├─ data.json                      ← 由 Excel 自動轉換出來，網頁實際讀取這份
├─ scripts/
│  └─ convert_xlsx_to_json.py     ← 轉換用的 Python 腳本
└─ .github/workflows/convert.yml  ← GitHub Actions：每次更新 data.xlsx 就自動重新產生 data.json
```

你完全不需要看懂程式碼，只要記得：**要更新資料，就換掉 `data.xlsx` 這個檔案。**

---

## 第一次上架：建立 GitHub Pages 網站

### 步驟 1：建立 GitHub 帳號與新的 Repository

1. 到 [github.com](https://github.com) 註冊帳號（若還沒有）。
2. 右上角 `+` → `New repository`。
3. Repository name 隨意取，例如 `mabinogi-exchange`。
4. Visibility 選 `Public`（GitHub Pages 免費方案需要 Public repo）。
5. 其他選項不用勾，直接按 `Create repository`。

### 步驟 2：把這個資料夾整個上傳

在剛建立的空 repository 頁面：

1. 點選 `uploading an existing file`（或 `Add file` → `Upload files`）。
2. 把 `maple-sim` 資料夾內的**所有檔案與資料夾**（含隱藏的 `.github` 資料夾）拖曳上傳。
   - 如果網頁介面拖不進隱藏資料夾 `.github`，改用下方「進階：用 Git 指令上傳」的方法一次上傳，最保險。
3. 下方填寫 commit message（例如「初次上傳」），按 `Commit changes`。

> 提醒：GitHub 網頁介面偶爾不容易處理巢狀資料夾（`.github/workflows/...`），
> 若上傳後發現 Actions 分頁找不到工作流程，建議改用下面「進階：用 Git 指令上傳」。

### 步驟 3：開啟 GitHub Pages

1. 進入 repository → 上方選單 `Settings`。
2. 左側選單找到 `Pages`。
3. `Source` 選擇 `Deploy from a branch`。
4. `Branch` 選擇 `main`，資料夾選 `/ (root)`，按 `Save`。
5. 等待約 1 分鐘，重新整理頁面，會出現一個網址，格式類似：
   `https://你的帳號.github.io/mabinogi-exchange/`
6. 打開這個網址，就是可以分享給大家使用的兌換手冊網頁。

---

## 之後要更新資料時（最常用的流程）

只要瑪奇的兌換內容有變動，重新整理好 Excel 之後：

1. 回到 GitHub 上你的 repository。
2. 點進 `data.xlsx` 這個檔案。
3. 右上角垃圾桶旁邊的鉛筆圖示旁，選 `...` → 或直接點檔案頁的 `Upload files`，
   把新版的 Excel 檔案拖進去，**檔名務必還是 `data.xlsx`**，直接覆蓋上傳。
4. 填寫 commit message（例如「更新兌換資料 9/16」），按 `Commit changes`。
5. 稍等 30 秒～1 分鐘，GitHub Actions 會自動執行轉換，
   把新的 `data.xlsx` 轉成 `data.json` 並自動提交回 repository。
   - 可以到上方 `Actions` 分頁看到一個正在執行或已完成（綠勾勾）的工作流程，
     名稱是「轉換 Excel 為網頁資料 (data.json)」。
6. 完成後重新整理你的 GitHub Pages 網址，網頁就會顯示最新資料。

**你完全不需要碰程式、不需要在自己電腦上安裝任何東西**，只要換檔案、按 Commit。

---

## Excel 格式規則（更新資料時請保持一致）

轉換腳本會自動尋找欄位標題所在列，並依標題文字判斷欄位，規則如下：

| 欄位標題（可以是這些文字其中之一，只要「包含」即可辨識） | 對應意義 |
|---|---|
| 地區 | 兌換地區／城鎮 |
| NPC | 兌換對象 NPC 名稱 |
| 兌換物品 | 可以換到的物品名稱 |
| 所需資源（或「所需資源(最大值)」等變體） | 兌換需要付出的材料，格式須為 `名稱*數量`，例如 `原木*10` |
| 特殊商店 | 額外備註，例如兌換幣別商店、特殊取得管道 |

其他規則：

- **合併儲存格**沿用你目前的排版方式即可：同一個地區/NPC 可以合併多列；
  同一個「兌換物品」若有兩種以上兌換方式（例如可用材料 A 或材料 B 兌換），
  把「兌換物品」欄位合併、但「所需資源」欄位各自填寫不同列，腳本就會自動辨識成「多種兌換方式」。
- 材料數量格式支援 `*`、`×`、`x`、`X`，例如 `原木*10`、`原木×10` 皆可。
- 若某一列只有 NPC 和「特殊商店」欄位、沒有兌換物品／所需資源（例如：伊文 → 魔物討伐證明），
  會被歸類成頁面下方的「其他兌換備註」區塊。
- 不要更動標題文字太多（例如不要把「地區」整個改成別的詞），
  否則腳本會找不到欄位並轉換失敗（GitHub Actions 頁面會顯示紅色叉叉，可以點進去看錯誤訊息）。

---

## 進階：用 Git 指令上傳（技術使用者適用，較穩定）

如果你電腦上有安裝 [Git](https://git-scm.com/)：

```bash
cd maple-sim
git init
git add .
git commit -m "初次上傳"
git branch -M main
git remote add origin https://github.com/你的帳號/mabinogi-exchange.git
git push -u origin main
```

之後每次更新資料：

```bash
# 把新的 Excel 覆蓋到 data.xlsx 之後
git add data.xlsx
git commit -m "更新兌換資料"
git push
```

GitHub Actions 一樣會自動幫你重新產生 `data.json`。

---

## 想在自己電腦先預覽（不上傳也能測試）

在 `maple-sim` 資料夾內開一個終端機，執行：

```bash
python3 scripts/convert_xlsx_to_json.py data.xlsx data.json
python3 -m http.server 8000
```

然後瀏覽器開啟 `http://localhost:8000/` 即可預覽（直接雙擊 `index.html` 開啟可能因瀏覽器安全限制讀不到 `data.json`，建議用上面的方式啟動本機伺服器）。
