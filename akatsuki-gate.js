/*
 * 一般社団法人 暁月　診断ツール 期限ゲート v1.0
 * 各診断ページの <head> の直後に次の1行を入れて使います。
 *   <script src="/akatsuki-gate.js"></script>
 * 合言葉・案内文の変更は、このファイルだけを直せば全ページに反映されます。
 */
(function () {
  "use strict";

  // ── 設定（ここだけ変更） ─────────────────────────
  var SECRET = "akt-FCVfx9EqsM";          // 発行ツールと同じ合言葉
  var PUBLIC_HOSTS = ["akatsukicoach.org"]; // この埋め込み元では鍵なしで表示
  var CONTACT = "研修担当者、または一般社団法人 暁月までお問い合わせください。";
  // ────────────────────────────────────────────

  var KEY_STORE = "akatsuki_gate_key";
  var EMBED_STORE = "akatsuki_gate_embed";
  var root = document.documentElement;
  root.style.visibility = "hidden";

  function hash(s, m) {
    var x = 7;
    for (var i = 0; i < s.length; i++) x = (x * m + s.charCodeAt(i)) >>> 0;
    return x.toString(36);
  }
  function sign(d) {
    return (hash(d + SECRET, 31) + hash(SECRET + d, 131)).slice(0, 8);
  }
  function endOfDayJST(d) {
    // YYYYMMDD の日本時間 23:59:59
    return Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), 14, 59, 59);
  }
  function get(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { store.setItem(k, v); } catch (e) {} }
  function del(store, k) { try { store.removeItem(k); } catch (e) {} }

  // 1. グーペ（公開サイト）への埋め込みは鍵なしで通す
  var inFrame = false;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  var ref = document.referrer || "";
  var fromPublic = PUBLIC_HOSTS.some(function (h) { return ref.indexOf(h) !== -1; });
  if (inFrame && fromPublic) set(sessionStorage, EMBED_STORE, "1");
  if (inFrame && get(sessionStorage, EMBED_STORE) === "1") {
    root.style.visibility = "";
    return;
  }

  // 2. 鍵付きURL（?k=YYYYMMDD-xxxxxxxx）を確認
  var fromUrl = new URLSearchParams(location.search).get("k");
  var key = fromUrl || get(localStorage, KEY_STORE) || "";
  var parts = key.split("-");
  var date = parts[0], sig = parts[1];
  var wellFormed = /^\d{8}$/.test(date) && sig === sign(date);
  var expired = wellFormed && Date.now() > endOfDayJST(date);

  if (wellFormed && !expired) {
    set(localStorage, KEY_STORE, key);
    root.style.visibility = "";
    return;
  }
  if (!fromUrl) del(localStorage, KEY_STORE);

  // 3. 利用できない場合の案内
  var message = expired
    ? "ご利用期間は " + date.slice(0, 4) + "年" + (+date.slice(4, 6)) + "月" + (+date.slice(6, 8)) + "日 で終了しました。"
    : "このURLではご利用いただけません。お送りしたURLを、そのまま開いてください。";

  function render() {
    document.title = "ご利用いただけません｜一般社団法人 暁月";
    document.body.innerHTML =
      '<main style="max-width:32em;margin:0 auto;padding:22vh 24px 0;font-family:\'Meiryo UI\',Meiryo,\'Hiragino Sans\',sans-serif;color:#1B1B1B;line-height:1.9">' +
      '<p style="margin:0;font-family:Cambria,Georgia,serif;font-style:italic;color:#B8860B;font-size:15px">Access closed</p>' +
      '<h1 style="margin:.2em 0 .9em;font-size:20px;color:#1B2340;font-weight:700">診断をご利用いただけません</h1>' +
      '<p style="margin:0 0 1.2em;border-top:1px solid #B8860B;padding-top:1.2em">' + message + "</p>" +
      '<p style="margin:0;color:#7A7A7A;font-size:14px">' + CONTACT + "</p>" +
      '<p style="margin:3em 0 0;color:#1B2340;font-size:13px;letter-spacing:.08em">一般社団法人 暁月</p>' +
      "</main>";
    document.body.style.margin = "0";
    document.body.style.background = "#FFFFFF";
    root.style.visibility = "";
  }
  if (document.body) render();
  else document.addEventListener("DOMContentLoaded", render);
})();
