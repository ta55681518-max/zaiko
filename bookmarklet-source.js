/* ============================================================
   煙屋 在庫アプリ用ブックマークレット（元ソース・可読版）
   E-POSの「商品別商品集計」ページで実行すると、
   商品名＋出数を読み取ってクリップボードにコピーする。
   → 在庫アプリの「今日の出数」に貼り付けるだけ。

   ★2026-07-28 改良：E-POSの表は「商品名」が左に固定された別テーブル、
   数字（平均単価/出数/金額…）が別テーブルになっている構成。
   固定列（商品名）と数字列（出数）を行ごとに合体して読むようにした。
   値段(円)・比率(%)は除外し、出数（裸の整数）だけを拾う。
   ============================================================ */
(function () {
  try {
    var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
    var toNum = function (s) { return (s || '').replace(/[,\s]/g, ''); };
    // 「円」「%」を含まない裸の整数 = 出数とみなす（平均単価・金額・粗利・比率を除外）
    var isBareInt = function (s) {
      var t = norm(s);
      return !/[円%¥￥]/.test(t) && /^\d{1,6}$/.test(toNum(t));
    };
    // 商品名らしいセル：数字・値段・記号だけでなく、文字を含む。ヘッダ語や合計は除外。
    var isName = function (s) {
      var t = norm(s);
      if (!t) return false;
      if (/^[ABC]$/.test(t)) return false;
      if (/合計|総計|小計|商品名|メニュー|品名|出数|数量|平均|単価|金額|粗利|構成|比率|カテゴリ|部門|順位/.test(t)) return false;
      return /[^\d,.\s円%¥￥\-]/.test(t);
    };

    // 表は本体ページだけでなく iframe の中にあることもある
    var docs = [document];
    [].slice.call(document.querySelectorAll('iframe,frame')).forEach(function (f) {
      try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
    });
    var tables = [];
    docs.forEach(function (d) { tables = tables.concat([].slice.call(d.querySelectorAll('table'))); });

    function cellsOf(r) {
      return [].slice.call(r.querySelectorAll('td,th')).map(function (c) { return norm(c.textContent); });
    }

    // テーブルごとに、各行の「商品名候補」と「出数候補」を作る
    var nameCols = [], qtyCols = [];
    tables.forEach(function (t) {
      var rows = [].slice.call(t.querySelectorAll('tr')), names = [], qtys = [];
      rows.forEach(function (r) {
        var c = cellsOf(r), nm = '', q = '';
        for (var i = 0; i < c.length; i++) { if (isName(c[i])) { nm = c[i]; break; } }
        for (var j = 0; j < c.length; j++) { if (isBareInt(c[j])) { q = toNum(c[j]); break; } }
        names.push(nm); qtys.push(q);
      });
      nameCols.push(names); qtyCols.push(qtys);
    });

    // 商品名が一番たくさん取れたテーブル・出数が一番取れたテーブルを採用
    function cnt(a) { var n = 0; a.forEach(function (x) { if (x) n++; }); return n; }
    var nameT = -1, nb = 0; nameCols.forEach(function (a, i) { var c = cnt(a); if (c > nb) { nb = c; nameT = i; } });
    var qtyT = -1, qb = 0; qtyCols.forEach(function (a, i) { var c = cnt(a); if (c > qb) { qb = c; qtyT = i; } });

    // 行インデックスで商品名と出数を合体（単一テーブルでも同じ行なので成立）
    var out = [];
    if (nameT >= 0 && qtyT >= 0) {
      var N = nameCols[nameT], Q = qtyCols[qtyT], L = Math.max(N.length, Q.length);
      for (var i = 0; i < L; i++) { if (N[i] && Q[i]) out.push(N[i] + '\t' + Q[i]); }
    }

    if (!out.length) {
      alert('データが読み取れんかったさ。\n「商品別商品集計」を抽出した表のページで押してね。');
      return;
    }

    var text = out.join('\n');
    var done = function () {
      alert(out.length + '品コピーしたさ！\n\n在庫アプリを開いて「今日の出数」の枠に貼り付け → 読み取る、してね。');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(); });
    } else { legacy(); }

    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { window.prompt('下の内容をコピーして在庫アプリに貼ってね', text); }
      ta.remove();
    }
  } catch (e) {
    alert('エラーが出たさ: ' + (e && e.message ? e.message : e));
  }
})();
