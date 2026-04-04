(() => {
    // 웹사이트의 기본 메서드 무력화(Monkey Patching) 방어 및 복구
    const _recoveryIframe = document.createElement('iframe');
    _recoveryIframe.style.display = 'none';
    document.documentElement.appendChild(_recoveryIframe);

    window.alert = _recoveryIframe.contentWindow.alert;
    Element.prototype.remove = _recoveryIframe.contentWindow.Element.prototype.remove;
    Node.prototype.removeChild = _recoveryIframe.contentWindow.Node.prototype.removeChild;
    /*
        만든사람: https://github.com/spspwl12

        특징

        1. 아카콘, 디시콘, 개드립콘, 인벤콘(스티커) 다운로드 지원
        2. 아카콘 API를 활용해 원본 GIF를 추출 및 다운로드
        3. MP4 → GIF 변환 (멀티스레드 지원)
        4. GIF 간단 편집 (속도 조절, 프레임 삭제, 밝기 조절, 샤픈(선명도) 조절, GIF 최적화)
        5. GIF 프레임을 PNG 이미지로 저장
        6. 설정값을 저장해 재실행 시 옵션창 자동 숨김
        7. 좌측 상단 흰색 상태바의 설정 버튼 클릭 시 숨겨진 옵션창 활성화
        8. 이미 다운로드한 이모티콘에 색상을 입혀 시각적으로 구분
        9. 모바일 다운로드 (비공식)
    */

    const PROXY_SERV_URL = "https://jfkskw.duckdns.org:17875/proxy?url=%%%ENCODEURL%%%";  // 디시콘, 개드립콘 프록시 서버 설정
    const JS_ZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"; // 압축 파일 관련 모듈
    const FFMPEG_CORE_JS_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.min.js"; // gif 파일 변환 관련 모듈
    const FFMPEG_CORE_WASM_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm"; // gif 파일 변환 관련 모듈
    const GIF_EDIT_URL = "https://shoag7449.github.io/acacon/gifs.js"; // gif 파일 편집 관련 모듈
    const MODERN_CSS_TEXT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --danger: #ef4444;
    --danger-hover: #dc2626;
    --bg-glass: rgba(255, 255, 255, 0.85);
    --border-glass: rgba(255, 255, 255, 0.4);
    --shadow-soft: 0 10px 25px rgba(0, 0, 0, 0.1);
    --text-main: #1f2937;
    --text-muted: #6b7280;
    --font-family: 'Inter', -apple-system, sans-serif;
}

.noticefrm {
    font-size: 15px;
    font-family: var(--font-family);
    position: fixed;
    top: 20px;
    left: 20px;
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-glass);
    box-shadow: var(--shadow-soft);
    padding: 10px 18px;
    border-radius: 20px;
    z-index: 9999999999;
    color: var(--text-main);
    font-weight: 500;
    user-select: none;
    transition: all 0.3s ease;
    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 90vw;
}

.noticefrm-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.noticefrm-settings-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 2px;
    margin-left: 4px;
    opacity: 0.6;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
}
.noticefrm-settings-btn:hover {
    opacity: 1;
    background: rgba(0,0,0,0.05);
    transform: rotate(30deg);
}

.toast-msg {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #fff;
    padding: 14px 24px;
    border-radius: 12px;
    font-family: var(--font-family);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
    white-space: pre-line;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 99999999999;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    max-width: 400px;
    text-align: center;
}
.toast-msg.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

.noticefrm .download {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
}
.noticefrm .download:hover {
    text-decoration: underline;
}

.mainfrm {
    font-family: var(--font-family);
    color: var(--text-main);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 24px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
    width: 280px;
    z-index: 9999999999;
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
    from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.mainfrm > div {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mainfrmlbl {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
}

.mainfrmSpan {
    margin: 0 8px;
    font-size: 14px;
}

.mainfrmSelect {
    width: 100px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    background: #fff;
    font-family: var(--font-family);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    cursor: pointer;
}
.mainfrmSelect:focus {
    border-color: var(--primary);
}

.selLbl, .selTxt {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

input[type=checkbox], input[type=radio] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
    flex-shrink: 0;
}
input[type=checkbox]:checked {
    background-color: var(--primary);
    border-color: var(--primary);
}
input[type=checkbox]:checked::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.mainfrmBtn1, .mainfrmBtn2 {
    margin-top: 8px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-family: var(--font-family);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
}
.mainfrmBtn1 {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.mainfrmBtn1:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}
.mainfrmBtn1:active { transform: translateY(0); }

.mainfrmBtn2 {
    background: #f3f4f6;
    color: var(--text-main);
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.mainfrmBtn2:hover {
    background: #e5e7eb;
}

.gifEditfrm {
    font-family: var(--font-family);
    color: var(--text-main);
    display: flex;
    align-content: flex-start;
    justify-content: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(250, 250, 250, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 24px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 70%;
    height: 70%;
    overflow-y: auto;
    z-index: 9999999999;
    flex-wrap: wrap;
    gap: 16px;
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.gifEditfrm::-webkit-scrollbar { width: 8px; }
.gifEditfrm::-webkit-scrollbar-track { background: transparent; }
.gifEditfrm::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.gifEditfrm .close-btn {
    position: absolute;
    top: 16px;
    right: 20px;
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 24px;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}
.gifEditfrm .close-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
    transform: rotate(90deg);
}

.gifEditfrmItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    padding: 16px 12px;
    border-radius: 16px;
    width: 140px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}
.gifEditfrmItem:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
}

.transp_bg {
    background-image: linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
        linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
        linear-gradient(-45deg, transparent 75%, #f1f5f9 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

.gifEditfrmItemImg {
    width: 100px;
    height: 100px;
    object-fit: contain;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s;
    background-color: #fff;
    margin-bottom: 12px;
}
.gifEditfrmItemImg.zoom {
    width: 250px;
    height: auto;
    max-width: none;
    position: absolute;
    z-index: 10000;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    border: 4px solid #fff;
    border-radius: 12px;
    transform: scale(1.05);
}

.gifEditfrmItemInfo {
    margin: 12px 0 16px 0;
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    text-align: center;
    word-break: break-all;
    line-height: 1.4;
}

.gifEditfrmBtnGrp {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    margin-top: auto;
}

.gifEditfrmBtn {
    padding: 6px 0;
    border: none;
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    font-size: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-family);
}
.gifEditfrmBtn:hover {
    background: #e2e8f0;
    color: #0f172a;
}
.gifEditfrmBtn:active {
    transform: scale(0.96);
}

.gifAdjustPopup {
    position: fixed;
    min-width: 260px;
    max-height: 80vh;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    color: var(--text-main);
    padding: 20px;
    font-family: var(--font-family);
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 99999999999;
}
.gifAdjustPopup.visible {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
}

.gifAdjustPopup::before {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 8px 8px 8px;
    border-style: solid;
    border-color: transparent transparent rgba(255,255,255,0.95) transparent;
}

.gifAdjustPopup .close-btn {
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    font-size: 20px;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s;
}
.gifAdjustPopup .close-btn:hover { color: #0f172a; }

.gifAdjustPopup .popup-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    gap: 8px;
}
.gifAdjustPopup .popup-row label {
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: #475569;
}

.gifAdjustPopup .popup-row label input[type="text"] {
    margin-left: auto;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 13px;
    width: 60px;
    text-align: center;
    outline: none;
}
.gifAdjustPopup .popup-row label input[type="text"]:focus {
    border-color: var(--primary);
}

.gifAdjustPopup .popup-row label input[type="range"] {
    margin-left: 10px;
    flex-grow: 1;
    accent-color: var(--primary);
}

.gifAdjustSubmit {
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    border: none;
    background: var(--primary);
    color: #fff;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}
.gifAdjustSubmit:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}
.gifAdjustSubmit:active { transform: translateY(0); }
\`;`;
    const ARKA_API_URL = "https://arca.live/api/emoticon/%%%EMOID%%%"; // 아카라이브 이모티콘 api
    const F366C_STR = "f366c_"; // localStorage에서 prefix로 사용

    // ffmpeg_core 파일에 추가적으로 작성할 코드 ( worker 에서 쓰일 예정 )
    const WORKER_ADDITION_CODE = `;;;
    self.onmessage = async function(e) {
        const msg = e.data;
        if (!createFFmpegCore.__self )
            createFFmpegCore.__self = await createFFmpegCore({
                mainScriptUrlOrBlob: "${btoa(JSON.stringify({ wasmURL: FFMPEG_CORE_WASM_URL }))}",
                print: () => {},
                printErr: () => {},
                onExit: () => {},
            });
        
        const ffmpeg = createFFmpegCore.__self;
        const rst = ffmpeg.FS.writeFile("a.mp4", new Uint8Array(await msg.blob.arrayBuffer()));
        await ffmpeg.exec(
            "-f", "mp4",
            "-i", "a.mp4",
            ... (msg.filter ? ["-filter_complex", msg.filter] : []), "b.gif",
            "-pix_fmt", "rgb24");
        const gifData = ffmpeg.FS.readFile("b.gif");
        self.postMessage({
            size: msg.blob.size,
            blob: new Blob([gifData.buffer], { type: "image/gif" })
            });
    };`;

    // 공용 함수 정의
    const append = (parent, child) => parent.appendChild(child);
    const insertBf = (parent, child) => parent.insertBefore(child, parent.firstChild);
    const checkFunc = (e) => !window[e];
    const setAttr = (a, b, c) => a.setAttribute(b, c);
    const getAttr = (a, b) => a.getAttribute(b);
    const setHTML = (object, html, _append) => object.innerHTML = (_append ? object.innerHTML : "") + html;
    const setStatus = (e) => {
        if (!alert_tag) return;
        const target = alert_tag.querySelector('.noticefrm-text') || alert_tag;
        setHTML(target, e);
    };
    const validString = (e) => (typeof e === 'string' && e.length > 0);
    const setObjectVarParam = (...args) => args.find(v => v != null && (typeof v !== 'string' || v.length > 0)) ?? null;
    const createTag = (tag, parent) => {
        const e = document.createElement(tag);
        if (parent)
            append(parent, e);
        return e;
    };
    const createTagHTML = (tag, html, parent) => {
        const e = document.createElement(tag);
        if (html)
            setHTML(e, html);
        if (parent)
            append(parent, e);
        return e;
    };
    const createControl = (control, parent, last) => {
        const e = document.createElement("input");
        e.type = control;
        if (parent)
            (last ? insertBf : append)(parent, e);
        return e;
    };
    const createTagClass = (tag, _class, text, parent) => {
        const e = createTag(tag);
        if (_class)
            e.className = _class;
        if (text)
            txtContent(e, text);
        if (parent)
            append(parent, e);
        return e;
    };
    const customAlert = (e) => {
        const existing = document.querySelector('.toast-msg');
        if (existing) existing.remove();
        const toast = createTagClass("div", "toast-msg", null);
        toast.textContent = e;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add("show"));
        });
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    };
    const setMinMax = (a, b, c, d) => a < b || a > c ? d : a;
    const revokURL = (e) => URL.revokeObjectURL(e);
    const createURL = (e) => URL.createObjectURL(e);
    const txtContent = (a, b) => a.textContent = b;
    const zeroPad = (a, b) => String(a).padStart(b, "0");
    const sleep = (ms) => new Promise(s => setTimeout(s, ms));
    const setFilename = (a, b) => zeroPad(a, 3) + "." + b;
    const createDownloadTag = (url, name) => {
        const link = createTag("a");
        link.href = url;
        link.download = name;
        link.click();
        return link;
    }
    const sendQueueMsg = (a, b, c) => a.postMessage({
        blob: b,
        filter: c
    });
    const fetchErr = async (a, b) => {
        try {
            return await fetch(a, b);
        } catch (e) {
            return {};
        }
    };
    const addHttpMissing = (url) => {
        try {
            if (!url.startsWith("http"))
                url = "https://" + url;
            return new URL(url).href;
        } catch (e) {
            return url;
        }
    };
    const parseMatch = (str, regex) => {
        if (typeof str !== "string")
            return null;

        const match = str.match(regex);

        if (match && match.length > 0)
            return match[1];

        return null;
    };
    const humanFileSize = (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };

    const makeChkbox = (f, n) => {
        const checkboxLabel = createTagClass("label", "mainfrmlbl");
        const checkboxText = createTagClass("span", "mainfrmSpan", n, checkboxLabel);
        const checkbox = createControl("checkbox", checkboxLabel);
        append(f, checkboxLabel);

        return checkbox;
    };

    // 현재 사이트가 프록시를 써야하는 사이트인지 알아내는 함수
    const isCORSErrSite = () => {
        if (document.location.hostname.endsWith('dcinside.com'))
            return 1;

        if (document.location.hostname.endsWith('dogdrip.net'))
            return 2;

        return 0;
    };

    // CSS 적용 (내장형)
    const style = createTag("style");
    style.textContent = MODERN_CSS_TEXT;
    document.head.appendChild(style);

    let alert_tag = document.getElementById(F366C_STR);

    if (!alert_tag) {
        alert_tag = createTagClass("div", "noticefrm");
        setAttr(alert_tag, "id", F366C_STR);

        createTagClass("span", "noticefrm-text", null, alert_tag);

        insertBf(document.body, alert_tag);
    }
    else {
        // 이전 실행에서 남은 "압축파일" 링크 제거
        const oldLink = alert_tag.querySelector('.download');
        if (oldLink) oldLink.remove();

        if (alert_tag.blobUrl && alert_tag.blobUrl.length > 0) {
            revokURL(alert_tag.blobUrl);
            alert_tag.blobUrl = null;
        }
    }

    // 옵션창이 먼저 보이므로 noticefrm은 숨긴다
    alert_tag.style.display = "none";

    const formContainer = createTagClass("div", `mainfrm`);
    const form = createTag("div", formContainer);

    const gifConvChk = makeChkbox(form, "GIF 변환");
    const gifEditChk = makeChkbox(form, "GIF 편집");
    const pngConvChk = makeChkbox(form, "PNG 변환");

    // gif 화질 설정칸
    const lossySelectLabel = createTagClass("label", "selLbl", null, form);
    const lossySelectText = createTagClass("span", "mainfrmSpan", "GIF 화질", lossySelectLabel);
    const lossySelectCombo = createTagClass("select", "mainfrmSelect", null, lossySelectLabel);

    // gif 프레임 설정칸
    const fpsSelectLabel = createTagClass("label", "selLbl", null, form);
    const fpsSelectText = createTagClass("span", "mainfrmSpan", "GIF 프레임", fpsSelectLabel);
    const fpsSelectCombo = createTagClass("select", "mainfrmSelect", null, fpsSelectLabel);

    // 콤보박스에 GIF 프레임 값을 넣는다
    [5, 12, 25, 33, 60].forEach(e => {
        const op = createTagClass("option", "", e);
        op.value = e;
        append(fpsSelectCombo, op);
    });

    [1, 100, 50, 30, 10, 5].forEach((e, i) => {
        const op = createTagClass("option", "", e);
        op.value = e;
        op.text = ["기본", "최상", "상", "중", "하", "최하"][i];
        append(lossySelectCombo, op);
    });

    // localStorage에서 저장된 설정값을 가져오는 코드
    gifConvChk.checked = (localStorage.getItem(F366C_STR + "chk1") ?? "true") === "true";
    gifEditChk.checked = (localStorage.getItem(F366C_STR + "chk2") ?? "false") === "true";
    pngConvChk.checked = (localStorage.getItem(F366C_STR + "chk3") ?? "true") === "true";

    const savedLossyValue = setMinMax(localStorage.getItem(F366C_STR + "lossyval"), 1, 100, 100);
    lossySelectCombo.value = savedLossyValue;

    const savedFpsValue = setMinMax(localStorage.getItem(F366C_STR + "fpsval"), 5, 60, 33);
    fpsSelectCombo.value = savedFpsValue;

    lossySelectCombo.addEventListener("change", e => {
        fpsSelectLabel.style.display = parseInt(e.target.value) === 1 ? "none" : "flex";
    });

    lossySelectCombo.dispatchEvent(new Event('change'));

    const cors = isCORSErrSite();

    if (cors) {
        const noticeHttpsCert = createTagClass("a", null, "디시콘, 개드립콘 다운로드할때 클릭", form);
        noticeHttpsCert.style.display = "none";

        (async () => {
            const proxyUrl = new URL(PROXY_SERV_URL);
            const proxyCheckUrl = proxyUrl.origin + proxyUrl.pathname;
            const iserr = await fetchErr(proxyCheckUrl);

            if (iserr && iserr.ok) {
                noticeHttpsCert.remove();
                return;
            }

            setAttr(noticeHttpsCert, "href", "#");
            setAttr(noticeHttpsCert, "onclick", `window.open("${PROXY_SERV_URL}", "", "width=400,height=600");`);
            setAttr(noticeHttpsCert, "style", "margin:0 5px;");
            setHTML(noticeHttpsCert, "<br>", true);
            noticeHttpsCert.style.display = "block";

            const interval = setInterval(async () => {
                const iserr = await fetchErr(proxyCheckUrl);
                if (iserr && iserr.ok) {
                    noticeHttpsCert.remove();
                    clearInterval(interval);
                }
            }, 5000);
        })();
    }

    const button1 = createTagClass("button", "mainfrmBtn1", "변환", form);
    const button2 = createTagClass("button", "mainfrmBtn2", "취소", form);

    append(document.body, formContainer);

    // alert_tag(noticefrm) 오른쪽에 설정 버튼 추가
    // 기존 설정 버튼이 있으면 제거 후 새로 생성
    const oldSettingsBtn = alert_tag.querySelector('.noticefrm-settings-btn');
    if (oldSettingsBtn) oldSettingsBtn.remove();

    const settings_btn = createTagClass("button", "noticefrm-settings-btn", "⚙️", alert_tag);
    setAttr(settings_btn, "title", "설정 열기");

    settings_btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (localStorage.getItem(F366C_STR) === "1") {
            customAlert(`다음부터 GIF 설정창이 나옵니다.`);
            localStorage.setItem(F366C_STR, 0);
        }
    });

    // localStorage에서 현재 설정값을 저장하는 코드
    const saveSettings = (e) => {
        localStorage.setItem(F366C_STR + "chk1", gifConvChk.checked);
        localStorage.setItem(F366C_STR + "chk2", gifEditChk.checked);
        localStorage.setItem(F366C_STR + "chk3", pngConvChk.checked);
        localStorage.setItem(F366C_STR + "lossyval", lossySelectCombo.value);
        localStorage.setItem(F366C_STR + "fpsval", fpsSelectCombo.value);
        localStorage.setItem(F366C_STR, e);
    };

    // 변환 버튼을 누를 경우 
    button1.addEventListener("click", () => {
        if (localStorage.getItem(F366C_STR) != 1)
            customAlert('좌측 상단의 흰색 상태 바의 ⚙️ 버튼을 클릭하면 옵션 창을 열 수 있습니다.\n\n' +
                '1. 아카콘 다운로드 가능.\n' +
                '2. 디시콘 다운로드 가능.\n' +
                '3. 개드립콘 다운로드 가능.\n' +
                '4. 인벤스티커 다운로드 가능.');

        saveSettings(1);
        (async () => {
            const loadJavaScript = (url) => {
                // 비동기로 js 파일을 불러온다.
                return new Promise((resolve, reject) => {
                    const script = createTag("script");
                    script.src = url;
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.head.appendChild(script);
                });
            };

            // JSZip 변수가 없을 경우 ( JSZip 이 로드가 안된경우 )
            if (checkFunc("JSZip")) {
                await loadJavaScript(JS_ZIP_URL);

                // 그래도 JSZip 변수가 없을 경우
                if (checkFunc("JSZip")) {
                    // 오류 띄우고 로직 종료
                    setStatus("JSZip 로드 실패.");
                    return;
                }
            }

            // GIFS 변수가 없을 경우 ( GIFS 이 로드가 안된경우 )
            if (gifEditChk.checked && checkFunc("GIFS")) {
                await loadJavaScript(GIF_EDIT_URL);

                // 그래도 GIFS 변수가 없을 경우
                if (checkFunc("GIFS")) {
                    // 오류 띄우고 로직 종료
                    setStatus("GIFS 로드 실패.");
                    return;
                }
            }

            const convertPng = (blob) => {
                // 이미지를 png로 변환하는 함수
                try {
                    const canvas = createTag("canvas");
                    const context = canvas.getContext("2d");

                    const img = new Image();
                    const objUrl = createURL(blob);
                    img.src = objUrl;

                    return new Promise((resolve, reject) => {
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            context.drawImage(img, 0, 0);

                            // blob 타입으로 변환한다.
                            canvas.toBlob((pngBlob) => {
                                resolve(pngBlob);
                                revokURL(objUrl);
                            }, "image/png");
                        };
                        img.onerror = () => {
                            revokURL(objUrl);
                            reject(new Error("Image load failed"));
                        };
                    });
                } catch (error) {
                    console.error(error);
                    return Promise.resolve(false);
                }
            };

            const extractExtension = (url) => {
                // url 에서 확장자를 추출하는 함수
                return parseMatch(url.split("?")[0], /\.(\w{2,4}$)/);
            };

            const chkHeader = (buf) => {
                // 이미지 또는 영상 파일에서 헤더를 읽어 포멧이 무엇인지 판별하는 함수
                const fileSignatures = [
                    ["png", [0x89, 0x50, 0x4E, 0x47]],
                    ["webp", [0x52, 0x49, 0x46, 0x46]],
                    ["jpg", [0xFF, 0xD8, 0xFF]],
                    ["tiff", [0x49, 0x49, 0x2A]],
                    ["tiff", [0x4D, 0x4D, 0x2A]],
                    ["gif", [0x47, 0x49, 0x46]],
                    ["bmp", [0x42, 0x4D]]
                ];

                // mp4 식별자가 들어간 경우
                if (String.fromCharCode.apply(null, buf).includes("ftyp"))
                    return "mp4";

                for (const [format, signature] of fileSignatures) {
                    if (buf.slice(0, signature.length).every((val, i) => val === signature[i]))
                        return format;
                }
            }

            /*
                *************************************************************************
                *************************************************************************
                *************************************************************************
                *************************************************************************
                ************************** 사이트별 이미지 파싱 **************************
                *************************************************************************
                *************************************************************************
                *************************************************************************
                *************************************************************************
            */

            const currentURL = window.location.href;
            const domain = new URL(currentURL).host;
            const urls = [];
            let mp4cnt = 0;
            let img_count = 0;

            (async () => {
                const o = { url: "" };

                const _process = (o, proxy) => {
                    if (!validString(o.url))
                        return void (o.url = "");
                    o.url = parseMatch(o.url, /url\(["']?(.*?)["']?\)/) ?? o.url;
                    if (o.url.startsWith("./"))
                        o.url = new URL(o.url, currentURL).href;
                    o.url = addHttpMissing(o.url);
                    if ("mp4" === extractExtension(o.url))
                        ++mp4cnt;
                    if (proxy)
                        o.url = PROXY_SERV_URL.replace("%%%ENCODEURL%%%", encodeURIComponent(o.url));
                };

                const find_tag = (name) => {
                    try {
                        const tag = document.getElementsByClassName(name);

                        if (tag.length <= 0)
                            return [];

                        const firstTagName = tag[0].tagName.toLowerCase();
                        if (firstTagName === "img" || firstTagName === "video")
                            return Array.from(tag);
                        if (tag.length === 1)
                            return [...tag[0].querySelectorAll("img"), ...tag[0].querySelectorAll("video")];
                        if (tag.length > 1)
                            return Array.from(tag).map(e => e.querySelector("img") ?? e.querySelector("video"));
                    } catch (e) {
                        return [];
                    }
                };

                const add_url_prop = (i, j, k, l) => urls.push({ index: i, url: j, extension: k, element: l });

                // 아카라이브콘 검색 ( CORS 에러 발생 X )
                find_tag("emoticon").forEach((e, i) => {
                    if (validString(getAttr(e, "data-id"))) {
                        o.url = setObjectVarParam(e.src, getAttr(e, "data-src"));
                        _process(o, false);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                /*
                    gif, png 원본 추출

                    1. 아카라이브는 트래픽 절감을 위해 gif 를 mp4로 변환해서 표시한다. 
                    2. 디시인사이드도 마찬가지로 트래픽 절감을 위해 gif를 mp4로 변환하나, 
                    디시콘샵에서는 gif 원본이 출력되기 때문에 별도의 gif 원본 api를 이용 안 해도 된다.
                */

                if ((gifConvChk.checked && pngConvChk.checked) &&
                    lossySelectCombo.value == 100 /* lossySelectCombo.value 는 문자열이라 == 연산자를 이용해 정수타입과 비교 */ &&
                    urls.length > 0 && domain === "arca.live") {
                    const match = parseMatch(currentURL, /e\/(\d+)/);

                    if (match) {
                        const res = await fetchErr(ARKA_API_URL.replace("%%%EMOID%%%", match), {
                            cache: "no-store"
                        });

                        if (res.ok) {
                            const type = res.headers.get("content-type");
                            if (type && type.includes("application/json")) {
                                const json = await res.json();

                                if (json)
                                    json.forEach(e => {
                                        const found = urls.find(el => el.element && el.element.getAttribute("data-id") == e.id);
                                        if (found)
                                            found.url.unshift(addHttpMissing(e.imageUrl)); // url 배열 맨 앞에 추가한다. (우선순위 높음)
                                    });
                            }
                        }
                    }
                }

                if ((img_count = urls.length) > 0)
                    return;

                // 디시콘 검색 ( CORS 에러 발생 O )
                find_tag("img_dccon").forEach((e, i) => {
                    if (validString(o.url = e.src)) {
                        _process(o, true);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                if ((img_count = urls.length) > 0)
                    return;

                // 디시콘 모바일 검색 ( CORS 에러 발생 O )
                find_tag("sm-img").forEach((e, i) => {
                    if (validString(o.url = e.src)) {
                        _process(o, true);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                if ((img_count = urls.length) > 0)
                    return;

                // 개드립콘 검색 ( CORS 에러 발생 O )
                find_tag("stk_img_v").forEach((e, i) => {
                    if (e && e.style && validString(o.url = e.style["background-image"])) {
                        _process(o, true);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                if ((img_count = urls.length) > 0)
                    return;

                // 개드립콘 검색 ( CORS 에러 발생 O )
                find_tag("dogcon_img_v").forEach((e, i) => {
                    if (validString(o.url = e.src)) {
                        _process(o, true);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                if ((img_count = urls.length) > 0)
                    return;

                // 인벤콘 검색
                find_tag("product-sticker-list").forEach((e, i) => {
                    if (validString(o.url = e.src)) {
                        _process(o, false);
                        add_url_prop(i, [o.url], null, e);
                    }
                });

                if ((img_count = urls.length) > 0)
                    return;

            })().then(async () => {
                if (img_count <= 0) {
                    setStatus("이미지를 찾을 수 없습니다.");
                    localStorage.setItem(F366C_STR, 0);
                    return;
                }

                /*
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    *************************** 다운로드 함수 선언 ***************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                */

                setStatus(`이미지 ${img_count} 개를 발견했습니다. 다운로드 준비 중.`);

                const ffmpegs = [];

                if (gifConvChk.checked && mp4cnt > 0) {
                    // mp4 -> gif 는 변환이 느리므로 멀티스레드를 적극 활용한다.
                    const response = await fetch(FFMPEG_CORE_JS_URL);
                    const jsCode = (await response.text()) + WORKER_ADDITION_CODE;
                    const workerBlobUrl = createURL(new Blob([jsCode], { type: 'application/javascript' }));

                    for (let i = 0, j = Math.min(navigator.hardwareConcurrency, mp4cnt); i < j; ++i) {
                        // 스레드를 클라이언트 CPU 개수만큼 만든다 ( mp4가 별로 없으면 mp4 개수에 맞춤 )
                        const obj = new Worker(workerBlobUrl);

                        ffmpegs.push({
                            obj: obj,
                            size: 0,
                            queue: []
                        });

                        ((capture) => { // onmessage 안에서 worker를 참조하기 위해 중괄호로 감싼다.
                            obj.onmessage = (e) => {
                                const obj = capture.queue[0];
                                obj.size -= e.data.size;
                                obj.resolve(e.data.blob); // 끝날 때까지 대기하고 있는 convertGif 함수를 끝낸다.
                                capture.queue.shift();

                                if (capture.queue.length > 0) {
                                    // 대기열에 데이터가 있으면 다시 worker에게 메세지를 보낸다.
                                    const obj = capture.queue[0];
                                    sendQueueMsg(capture.obj, obj.blob, obj.filter);
                                }
                                else
                                    capture.queue.size = 0;
                            };
                        })(ffmpegs[i]);
                    }
                }

                // 변환 필터를 한 번만 계산한다 (모든 이미지가 동일한 설정을 사용하므로)
                const gifFilter = (() => {
                    const fps = fpsSelectCombo.value;
                    const lossy = lossySelectCombo.value;
                    if (lossy == 1) return null;
                    const lossyValue = Math.floor(lossy / 100 * 256);
                    const lossyOption = lossy >= 100 ? `palettegen` : `palettegen=max_colors=${lossyValue}`;
                    return `fps=${fps},scale=-1:-1:flags=lanczos,split [a][b];[a] ${lossyOption} [p];[b][p] paletteuse`;
                })();

                const convertGif = (blob) => {
                    return new Promise(resolve => {
                        ffmpegs.sort((a, b) => a.size - b.size);

                        const obj = ffmpegs[0]; // 상대적으로 작업량이 가벼운 worker를 분석해서 대기열에 추가
                        if (obj.queue.length <= 0)
                            sendQueueMsg(obj.obj, blob, gifFilter);

                        obj.size += blob.size;
                        obj.queue.push({ blob: blob, filter: gifFilter, resolve: resolve });
                    });
                };

                /*
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    **************************** 이미지 다운로드 ****************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                    *************************************************************************
                */

                const jsZip = new window["JSZip"]();
                let successCnt = 0;
                let failCnt = 0;
                const gifs = [];

                const options_info = () => {
                    return {
                        speed: {
                            enable: null,
                            speed: null
                        },
                        skipFrame: {
                            enable: null,
                            skip: null,
                            frameCount: null
                        },
                        brightnessFrame: {
                            enable: null,
                            brightness: null,
                        },
                        sharpenFrame: {
                            enable: null,
                            sharpen: null,
                        },
                        optimize: {
                            enable: null,
                            threshold: null
                        },
                        quality: {
                            enable: null,
                            quality: null
                        },
                    };
                };

                const URLDownloadImage = async (emoObj) => {
                    const setSt = (a, b, c) => setStatus(`이미지 ${a}/${b} 개 ` + `다운로드 완료. ${c} 개 실패.`);

                    try {
                        const response = await (async (a, b) => {
                            // url로부터 이미지 가져오기 ( 실패할 경우 총 3번 시도  )
                            for (let i = 0, j = 0; !b.ok && i < 3; ++i) {
                                b = await fetchErr(a[j], {
                                    cache: "no-store"
                                });
                                if (b && b.ok)
                                    break;

                                // 이미지 획득 실패할 경우 랜덤으로 딜레이 추가
                                await sleep(Math.floor(Math.random() * 1000) + 300);

                                if (j < a.length - 1)
                                    ++j;
                            }
                            return b;
                        })(emoObj.url, {}); // {} 의 의미 : for 문 안에 b.ok 할때 오류방지

                        // 총 3번 시도 했는데도 불구하고 못 얻었으면
                        if (!response.ok)
                            throw new Error("response Error");

                        const blob = await response.blob();

                        if (!blob)
                            throw new Error("blob Error");

                        // 얻은 이미지의 첫 10자리를 unsigned char 형으로 변환해서 무슨 코덱인지 판별
                        const hdr = chkHeader(new Uint8Array(await blob.slice(0, 10).arrayBuffer()));

                        if (hdr) // 코덱 판별에 성공하면 url 에 붙어있는 확장자를 무시하고 최우선으로 판단 ( 겉은 png인데 속은 jpg 인 경우가 있기 때문 )
                            emoObj.extension = hdr;

                        let al = true;

                        // gif 변환이 체크됐고 url 확장자가 mp4인 경우
                        if (gifConvChk.checked && emoObj.extension === "mp4") {
                            // gif 로 변환
                            const gb = await convertGif(blob);

                            if (gb) {
                                // zip 파일에 변환한 gif 파일을 추가한다.
                                // 파일 이름을 001.jpg 002.jpg 이런식으로 저장하기 위해 제로패딩 추가 ( 정렬에 도움이 됨 )
                                const filename = setFilename(emoObj.index, "gif");
                                jsZip.file(filename, gb);

                                if (gifEditChk.checked)
                                    gifs.push({
                                        url: createURL(gb),
                                        blob: gb,
                                        tmpBlob: gb,
                                        name: filename,
                                        info: {
                                            itemtag: null,
                                            nametag: null,
                                            imgtag: null,
                                            options: options_info()
                                        }
                                    });

                                al = false;
                            }
                            else
                                throw new Error("convert Gif Error");
                        }
                        // png 변환이 체크됐고 확장자가 jpeg,jpg,webp,bmp,tiff 에 포함됐다면
                        else if (pngConvChk.checked && "jpeg|jpg|webp|bmp|tiff".includes(emoObj.extension)) {
                            // png 변환
                            const gb = await convertPng(blob);

                            if (gb) {
                                // zip 파일에 변환한 png 파일을 추가한다.
                                jsZip.file(setFilename(emoObj.index, "png"), gb);
                                al = false;
                            }
                            else
                                throw new Error("convert Png Error");
                        }

                        // gif 도 아니고 png 도 아닌 경우 그냥 파일 그대로 zip에 넣는다
                        if (al) {
                            const filename = setFilename(emoObj.index, emoObj.extension);
                            jsZip.file(filename, blob);

                            if (gifEditChk.checked && emoObj.extension === "gif")
                                gifs.push({
                                    url: createURL(blob),
                                    blob: blob,
                                    tmpBlob: blob,
                                    name: filename,
                                    info: {
                                        itemtag: null,
                                        nametag: null,
                                        imgtag: null,
                                        options: options_info()
                                    }
                                });
                        }

                        ++successCnt;
                        setSt(successCnt, img_count, failCnt);

                        // 변환이 된 이미지를 품고 있는 html 태그는 배경색을 바꾼다
                        emoObj.element.style.cssText += ";filter:sepia(100%) hue-rotate(90deg)";
                        await sleep(Math.floor(Math.random() * 500) + 200);
                    } catch (error) {
                        ++failCnt;
                        setSt(successCnt, img_count, failCnt);
                        console.error(error);
                    }
                }

                const tasks = [];

                for (const url of urls) {
                    // 추출이 된 url를 다운로드 한 뒤 변환하는 함수 호출
                    tasks.push(URLDownloadImage(url));
                }

                // 다운로드 뒤 변환이 끝난 경우
                Promise.all(tasks).then(async () => {
                    if (successCnt <= 0) {
                        localStorage.setItem(F366C_STR, 0);
                        return;
                    }

                    // 워커를 종료한다.
                    ffmpegs.forEach(e => e.obj.terminate());

                    try {
                        // 이미지를 추가한 zip 파일을 완성하고 blob 타입으로 변환
                        const zipContent = await jsZip.generateAsync({ type: "blob" });

                        // 하이퍼링크를 생성하고 zip blob 주소를 하이퍼링크 url로 대체
                        let title = document.getElementsByClassName("font_blue")[0];

                        if (title)
                            title = title.innerHTML;

                        if (!title)
                            title = document.title;

                        const blobURL = createURL(zipContent);
                        const link = createDownloadTag(blobURL, title + ".zip");

                        // 압축파일 이라는 문자열을 하이퍼링크 text로 사용해 "압축파일" 글자를 클릭 할 경우 언제든지 다운로드 할 수 있도록 변경
                        txtContent(link, "압축파일");
                        link.className = "download";
                        setStatus(`을 다운로드 합니다. ${failCnt} 개 실패.`);
                        insertBf(alert_tag, link);
                        alert_tag.blobUrl = blobURL;
                    } catch (error) {
                        setStatus("zip 생성 에러");
                    }

                    /*
                        *************************************************************************
                        *************************************************************************
                        *************************************************************************
                        *************************************************************************
                        ******************************* GIF 편집 *******************************
                        *************************************************************************
                        *************************************************************************
                        *************************************************************************
                        *************************************************************************
                    */

                    if (gifEditChk.checked && gifs.length > 0) {
                        // gif 편집 폼을 만든다.
                        const makeAdjustPopup = (e, f) => {
                            // 팝업 프레임 함수
                            const apopup = document.getElementsByClassName("gifAdjustPopup");

                            if (apopup && apopup[0])
                                apopup[0].remove();

                            const popup = createTagClass("div", "gifAdjustPopup");

                            // transform이 있는 부모 안에서는 position:fixed가 깨지므로 body에 직접 추가
                            append(document.body, popup);
                            setAttr(popup, "role", "dialog");
                            setAttr(popup, "aria-modal", "true");

                            const close_btn = createTagClass("button", "close-btn", null, popup);
                            setAttr(close_btn, "aria-label", "닫기");
                            setHTML(close_btn, "&times;");

                            e.stopPropagation();

                            setTimeout((popup, form, e) => {
                                const btn = e.target.closest('.gifEditfrmBtn') || e.target;
                                const btnRect = btn.getBoundingClientRect();
                                const popupWidth = popup.offsetWidth;
                                const popupHeight = popup.offsetHeight;
                                const viewW = window.innerWidth;
                                const viewH = window.innerHeight;

                                // X: 버튼 중앙 정렬
                                let posX = btnRect.left + btnRect.width / 2 - popupWidth / 2;
                                if (posX + popupWidth > viewW) posX = viewW - popupWidth - 8;
                                if (posX < 0) posX = 8;

                                // Y: 버튼 바로 아래
                                let posY = btnRect.bottom + 8;

                                // 아래 공간 부족 → 버튼 위에 배치
                                if (posY + popupHeight > viewH) {
                                    posY = btnRect.top - popupHeight - 8;
                                }

                                // 위에도 부족 → 화면 중앙
                                if (posY < 0) {
                                    posY = Math.max(8, (viewH - popupHeight) / 2);
                                }

                                popup.style.left = posX + 'px';
                                popup.style.top = posY + 'px';
                                popup.classList.add('visible');
                            }, 100, popup, form, e);

                            close_btn.addEventListener('click', e => {
                                e.stopPropagation();
                                popup.remove();
                            });

                            const outsideClickHandler = e => {
                                // 바깥 클릭 시에만 닫기
                                if (!popup.contains(e.target)) {
                                    popup.remove();
                                    document.removeEventListener('click', outsideClickHandler);
                                }
                            };
                            document.addEventListener('click', outsideClickHandler);

                            return popup;
                        };

                        const form = createTagClass("div", "gifEditfrm");

                        const close_btn = createTagClass("button", "close-btn", null, form);
                        setHTML(close_btn, "&times;");

                        close_btn.addEventListener('click', e => {
                            e.stopPropagation();
                            form.remove();
                        });

                        gifs.sort((a, b) => a.name.localeCompare(b.name));
                        gifs.push({
                            endboundary: true,
                            info: {
                                options: options_info()
                            }
                        });

                        const setImgSrcBlob = (index, blob, name_prefix) => {
                            const gif = gifs[index];
                            const url = gif.info.imgtag.src;

                            if (validString(url) && url.startsWith('blob:')) {
                                gif.info.imgtag.src = "";
                                setTimeout(revokURL, 300, url);
                            }

                            if (!name_prefix)
                                name_prefix = "";

                            const blobURL = createURL(blob);
                            gif.URL = blobURL;
                            gif.tmpBlob = blob;
                            gif.info.imgtag.src = blobURL;

                            setHTML(gif.info.nametag, gif.name + "<br>" + name_prefix + humanFileSize(blob.size));
                        };

                        gifs.forEach((_gif, itemIdx) => {
                            const item = createTagClass("div", "gifEditfrmItem");
                            const name = createTagClass("div", "gifEditfrmItemInfo", null, item);
                            const endIndex = _gif.endboundary;

                            const img = createTagClass("img", "gifEditfrmItemImg", null, item);
                            const img_name = _gif.name;

                            img.className += " transp_bg";

                            if (endIndex) {
                                // 이것은 100x100 크기의 투명 이미지 입니다.
                                img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAWVJREFUeF7t00ERAAAIhECvf2lr7AMTMODtOsrAKJpgriDYExSkIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC0EC/KEzwBlGO+pQQAAAABJRU5ErkJggg==";
                                img.className = "gifEditfrmItemImg_";
                                setHTML(name, "일괄<br>적용");
                            } else {
                                img.src = _gif.url;
                                setHTML(name, img_name + "<br>" + humanFileSize(_gif.blob.size));

                                img.addEventListener("click", (e) => {
                                    e.target.classList.toggle("zoom");
                                });
                            }

                            const buttonGroup = createTagClass("div", "gifEditfrmBtnGrp", null, item);

                            const btn1 = createTagClass("button", "gifEditfrmBtn", null, buttonGroup);
                            setHTML(btn1, "추출");

                            const btn2 = createTagClass("button", "gifEditfrmBtn", null, buttonGroup);
                            setHTML(btn2, "다운");

                            const btn3 = createTagClass("button", "gifEditfrmBtn", null, buttonGroup);
                            setHTML(btn3, "편집");

                            const btn4 = createTagClass("button", "gifEditfrmBtn", null, buttonGroup);
                            setHTML(btn4, "원본");

                            _gif.info.imgtag = img;
                            _gif.info.nametag = name;
                            _gif.info.itemtag = item;

                            buttonGroup.addEventListener('click', async (e) => {
                                const btn = e.target.closest('.gifEditfrmBtn');
                                if (!btn) return;
                                const idx = Array.prototype.indexOf.call(buttonGroup.children, btn);
                                switch (idx) {
                                    case 0:
                                        {
                                            // 추출 ( gif에 있는 프레임을 전부 다운받는다 )
                                            const buffers = [];

                                            const extZip = new window["JSZip"]();

                                            if (endIndex) {
                                                gifs.forEach(_gif => {
                                                    if (_gif.endboundary)
                                                        return;

                                                    buffers.push(_gif.tmpBlob.arrayBuffer());
                                                });
                                            } else {
                                                buffers.push(gifs[itemIdx].tmpBlob.arrayBuffer());
                                            }

                                            const result = await Promise.all(buffers);

                                            if (result.length <= 0)
                                                return;

                                            const editgifs = GIFS();
                                            const dec = editgifs.dec;

                                            dec.load({
                                                files: [],
                                                buffers: result,
                                                oncomplete: (F) => {
                                                    const tasks = [];

                                                    F.forEach((obj, index) => {
                                                        const frames = obj.frames;
                                                        const name = gifs[index].name;
                                                        const folder = F.length > 1 ? extZip.folder(name) : extZip;

                                                        frames.forEach((frame, index) => {
                                                            tasks.push(new Promise(resolve => {
                                                                frame.canvas.toBlob((blob) => {
                                                                    const filename = setFilename(index, "png");
                                                                    folder.file(filename, blob);
                                                                    resolve();
                                                                }, "image/png");
                                                            }));
                                                        });
                                                    })

                                                    Promise.all(tasks).then(async () => {
                                                        const zipContent = await extZip.generateAsync({ type: "blob" });
                                                        createDownloadTag(createURL(zipContent), "extract.zip");
                                                    });
                                                },
                                                onerror: e => { }
                                            });
                                            break;
                                        }
                                    case 1:
                                        {
                                            // 다운
                                            if (endIndex) {
                                                const extZip = new window["JSZip"]();

                                                gifs.forEach(_gif => {
                                                    if (_gif.endboundary)
                                                        return;

                                                    extZip.file(_gif.name, _gif.tmpBlob);
                                                });

                                                const zipContent = await extZip.generateAsync({ type: "blob" });
                                                createDownloadTag(createURL(zipContent), "download.zip");

                                            } else {
                                                createDownloadTag(_gif.info.imgtag.src, _gif.name);
                                            }
                                            break;
                                        }
                                    case 2:
                                        {
                                            // 편집  ( 속도, 최적화 )
                                            const popup = makeAdjustPopup(e, form);

                                            // 속도 조절 영역
                                            const popup_row1 = createTagClass("div", "popup-row", null, popup);
                                            const checkbox1 = createControl("checkbox", createTagHTML("label", "속도 변경", popup_row1), true);
                                            const lbl1 = createTagHTML("label", "", popup_row1);
                                            const range1 = createControl("range", lbl1);
                                            const vlbl1 = createTagHTML("div", "100%", lbl1);
                                            createTagHTML("label", "느림 <------------> 빠름", popup_row1);

                                            // 프레임 스킵 영역
                                            const popup_row2 = createTagClass("div", "popup-row", null, popup);
                                            const checkbox2 = createControl("checkbox", createTagHTML("label", "프레임 스킵", popup_row2), true);
                                            const textbox2 = createControl("text", createTagHTML("label", "건너뛸 수: ", popup_row2));
                                            const textbox2_1 = createControl("text", createTagHTML("label", "제거할 수: ", popup_row2));

                                            // 밝기, 샤픈 영역
                                            const popup_row3 = createTagClass("div", "popup-row", null, popup);
                                            const checkbox3 = createControl("checkbox", createTagHTML("label", "밝기 조절", popup_row3), true);
                                            const lbl3 = createTagHTML("label", "", popup_row3);
                                            const range3 = createControl("range", lbl3);
                                            const vlbl3 = createTagHTML("div", "100%", lbl3);

                                            const checkbox4 = createControl("checkbox", createTagHTML("label", "샤픈 조절", popup_row3), true);
                                            const lbl4 = createTagHTML("label", "", popup_row3);
                                            const range4 = createControl("range", lbl4);
                                            const vlbl4 = createTagHTML("div", "100%", lbl4);

                                            // 최적화 영역
                                            const popup_row4 = createTagClass("div", "popup-row", null, popup);
                                            const checkbox5 = createControl("checkbox", createTagHTML("label", "투명도 최적화", popup_row4), true);
                                            const lbl5 = createTagHTML("label", "", popup_row4);
                                            const range5 = createControl("range", lbl5);
                                            const vlbl5 = createTagHTML("div", "3%", lbl5);

                                            const checkbox6 = createControl("checkbox", createTagHTML("label", "색상 최적화", popup_row4), true);
                                            const lbl6 = createTagHTML("label", "", popup_row4);
                                            const range6 = createControl("range", lbl6);
                                            const vlbl6 = createTagHTML("div", "6", lbl6);

                                            const btn = createTagClass("button", "gifAdjustSubmit", null, popup);
                                            setHTML(btn, "적용");

                                            setAttr(range1, "min", "1");
                                            setAttr(range1, "max", "400");

                                            setAttr(range3, "min", "0");
                                            setAttr(range3, "max", "200");

                                            setAttr(range4, "min", "0");
                                            setAttr(range4, "max", "200");

                                            setAttr(range5, "min", "0");
                                            setAttr(range5, "max", "100");

                                            setAttr(range6, "min", "0");
                                            setAttr(range6, "max", "100");

                                            range1.oninput = range1.onchange = function () {
                                                setHTML(vlbl1, `${this.value}%`);
                                            };

                                            range3.oninput = range3.onchange = function () {
                                                setHTML(vlbl3, `${this.value}%`);
                                            };

                                            range4.oninput = range4.onchange = function () {
                                                setHTML(vlbl4, `${this.value}%`);
                                            };

                                            range5.oninput = range5.onchange = function () {
                                                setHTML(vlbl5, `${this.value}%`);
                                            };

                                            range6.oninput = range6.onchange = function () {
                                                setHTML(vlbl6, this.value);
                                            };

                                            const options = _gif.info.options;

                                            checkbox1.checked = options.speed.enable ?? false;
                                            range1.value = options.speed.speed ?? 100;
                                            range1.onchange();

                                            checkbox2.checked = options.skipFrame.enable ?? false;
                                            textbox2.value = options.skipFrame.skip ?? 1;
                                            textbox2_1.value = options.skipFrame.frameCount ?? 1;

                                            checkbox3.checked = options.brightnessFrame.enable ?? false;
                                            range3.value = options.brightnessFrame.brightness ?? 100;
                                            range3.onchange();

                                            checkbox4.checked = options.sharpenFrame.enable ?? false;
                                            range4.value = options.sharpenFrame.sharpen ?? 100;
                                            range4.onchange();

                                            checkbox5.checked = options.optimize.enable ?? false;
                                            range5.value = options.optimize.threshold ?? 3;
                                            range5.onchange();

                                            checkbox6.checked = options.quality.enable ?? false;
                                            range6.value = options.quality.quality ?? 6;
                                            range6.onchange();

                                            btn.addEventListener('click', async (e) => {
                                                e.stopPropagation();

                                                const works = [];

                                                // index를 배열에 저장해 단일, 다중 변환에 대응하도록 한다.
                                                if (endIndex)
                                                    for (let i = 0; i < gifs.length; ++i) works.push(i);
                                                else
                                                    works.push(itemIdx);

                                                // DOM에서 값을 한 번만 읽어 캐시한다
                                                const speedVal = parseInt(range1.value);
                                                const skipVal = parseInt(textbox2.value);
                                                const frameCountVal = parseInt(textbox2_1.value);
                                                const brightnessVal = parseInt(range3.value);
                                                const sharpenVal = parseInt(range4.value);
                                                const thresholdVal = parseInt(range5.value);
                                                const qualityVal = parseInt(range6.value);

                                                works.forEach(async e => {
                                                    const options = gifs[e].info.options;

                                                    options.speed.enable = checkbox1.checked;
                                                    options.speed.speed = speedVal;
                                                    options.skipFrame.enable = checkbox2.checked;
                                                    options.skipFrame.skip = skipVal;
                                                    options.skipFrame.frameCount = frameCountVal;
                                                    options.brightnessFrame.enable = checkbox3.checked;
                                                    options.brightnessFrame.brightness = brightnessVal;
                                                    options.sharpenFrame.enable = checkbox4.checked;
                                                    options.sharpenFrame.sharpen = sharpenVal;
                                                    options.optimize.enable = checkbox5.checked;
                                                    options.optimize.threshold = thresholdVal;
                                                    options.quality.enable = checkbox6.checked;
                                                    options.quality.quality = qualityVal;

                                                    if (gifs[e].endboundary)
                                                        return;

                                                    const arrayBuffer = await gifs[e].blob.arrayBuffer();
                                                    const editgifs = GIFS();
                                                    const changeGif = editgifs.changeGif;

                                                    changeGif({
                                                        buffer: arrayBuffer,
                                                        repeat: true,
                                                        quality: checkbox6.checked ? qualityVal : 6,
                                                        percentSpeed: checkbox1.checked ? speedVal / 100 : null,
                                                        skipFrame: options.skipFrame,
                                                        brightnessFrame: options.brightnessFrame,
                                                        sharpenFrame: options.sharpenFrame,
                                                        optimize: options.optimize,
                                                        oncomplete: (blob) => {
                                                            setImgSrcBlob(e, blob, "★ ");
                                                        },
                                                        onerror: e => { }
                                                    });
                                                });

                                                popup.remove();
                                            });

                                            break;
                                        }
                                    case 3:
                                        {
                                            // 원본 ( 원래의 파일로 복구 )
                                            const works = [];

                                            if (endIndex)
                                                for (let i = 0; i < gifs.length - 1; ++i) works.push(i);
                                            else
                                                works.push(itemIdx);

                                            works.forEach(async e => {
                                                const blob = await gifs[e].blob;
                                                setImgSrcBlob(e, blob);
                                                gifs[e].info.options = options_info();
                                            });
                                            break;
                                        }
                                }
                            });

                            append(form, item);
                        });

                        append(document.body, form);
                    }
                });
            });
        })();

        formContainer.style.display = "none";
        alert_tag.style.display = "flex";
    });

    button2.addEventListener("click", () => {
        saveSettings(0);
        formContainer.style.display = "none";
        alert_tag.remove();
    });

    const autostart = localStorage.getItem(F366C_STR);

    if (autostart === "1")
        button1.click();
})();