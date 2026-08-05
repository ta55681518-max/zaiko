/* E-POS 表デバッグ吸い出し用ブックマークレット（一時利用）
   商品別商品集計ページで実行 → 全テーブルの構造をクリップボードにコピー。
   壊さず読むだけ。結果をメールで送ってもらい、パーサーを合わせる。 */
(function () {
  try {
    var n = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
    var docs = [document];
    [].slice.call(document.querySelectorAll('iframe,frame')).forEach(function (f) {
      try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
    });
    var tables = [];
    docs.forEach(function (d) { tables = tables.concat([].slice.call(d.querySelectorAll('table'))); });
    var out = ['=== 表 ' + tables.length + '個 ==='];
    tables.forEach(function (t, k) {
      var rs = [].slice.call(t.querySelectorAll('tr'));
      out.push('[T' + k + '] 行数=' + rs.length);
      rs.slice(0, 6).forEach(function (r, ri) {
        var c = [].slice.call(r.querySelectorAll('td,th')).map(function (x) { return n(x.textContent); });
        out.push(' r' + ri + '(' + c.length + '): ' + c.join(' | '));
      });
    });
    var text = out.join('\n');
    var done = function () { alert('表の構造をコピーしたさ！\nメモかLINEに貼って、それをClaudeに送ってね。'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { lg(); });
    } else { lg(); }
    function lg() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { window.prompt('コピーして送ってね', text); }
      ta.remove();
    }
  } catch (e) { alert('エラー: ' + (e && e.message ? e.message : e)); }
})();
