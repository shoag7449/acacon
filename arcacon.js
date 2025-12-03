(() => {
    /*
        만든사람: https://github.com/spspwl12

        특징

        1. 아카콘, 디시콘, 개드립콘, 인벤콘(스티커) 다운로드 지원
        2. 아카콘 API를 활용해 원본 GIF를 추출 및 다운로드
        3. MP4 → GIF 변환 (멀티스레드 지원)
        4. GIF 간단 편집 (속도 조절, 프레임 삭제, 밝기 조절, 샤픈(선명도) 조절, GIF 최적화)
        5. GIF 프레임을 PNG 이미지로 저장
        6. 설정값을 저장해 재실행 시 옵션창 자동 숨김
        7. 좌측 상단 흰색 상태바 더블클릭 시 숨겨진 옵션창 활성화
        8. 이미 다운로드한 이모티콘에 색상을 입혀 시각적으로 구분
        9. 모바일 다운로드 (비공식)
    */

    const PROXY_SERV_URL = "https://jfkskw.duckdns.org:17875/proxy?url=%%%ENCODEURL%%%";  // 디시콘, 개드립콘 프록시 서버 설정
    const JS_ZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"; // 압축 파일 관련 모듈
    const FFMPEG_CORE_JS_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.min.js"; // gif 파일 변환 관련 모듈
    const FFMPEG_CORE_WASM_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm"; // gif 파일 변환 관련 모듈
    const GIF_EDIT_URL = "https://shoag7449.github.io/acacon/gifs.js"; // gif 파일 편집 관련 모듈
    const CSS_URL = "https://shoag7449.github.io/acacon/style.css"; // ui 스타일 정의 파일
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
    const setStatus = (e) => setHTML(alert_tag, e);
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
            setAttr(e, "class", _class);
        if (text)
            txtContent(e, text);
        if (parent)
            append(parent, e);
        return e;
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
            if (url.substr(0, 4) !== "http")
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

    // CSS 로드
    (async (e) => {
        const response = await fetchErr(CSS_URL);

        if (!response.ok)
            return;

        const cssText = await response.text();
        const style = createTag("style");
        style.textContent = cssText;
        document.head.appendChild(style);
    })();

    let alert_tag = document.getElementById(F366C_STR);

    if (!alert_tag) {
        alert_tag = createTagClass("div", "noticefrm");
        setAttr(alert_tag, "id", F366C_STR);
        insertBf(document.body, alert_tag);
    }
    else if (alert_tag.blobUrl && alert_tag.blobUrl.length > 0)
        revokURL(alert_tag.blobUrl);

    alert_tag.addEventListener("dblclick", () => {
        if (localStorage.getItem(F366C_STR) === "1")
            alert(`다음부터 GIF 설정창이 나옵니다.`);

        localStorage.setItem(F366C_STR, 0);
    });

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
        fpsSelectLabel.style.display = parseInt(e.target.value) === 1 ? "none" : "block";
    });

    lossySelectCombo.dispatchEvent(new Event('change'));

    const cors = isCORSErrSite();

    if (cors) {
        const noticeHttpsCert = createTagClass("a", null, "디시콘, 개드립콘 다운로드할때 클릭", form);
        noticeHttpsCert.style.display = "none";

        (async () => {
            const url = new URL(PROXY_SERV_URL);
            const iserr = await fetchErr(url.origin + url.pathname);

            if (iserr && iserr.ok) {
                noticeHttpsCert.remove();
                return;
            }

            setAttr(noticeHttpsCert, "href", "#");
            setAttr(noticeHttpsCert, "onclick", `window.open("${PROXY_SERV_URL}", "", "width=400,height=600");`);
            setAttr(noticeHttpsCert, "style", "margin:0 5px;");
            setHTML(noticeHttpsCert, "<br>", true);
            noticeHttpsCert.style.display = "block";

            const interval = setInterval(async e => {
                const url = new URL(PROXY_SERV_URL);
                const iserr = await fetchErr(url.origin + url.pathname);
                if (iserr && iserr.ok) {
                    noticeHttpsCert.remove();
                    clearInterval(interval);
                }
            }, 5000, noticeHttpsCert);
        })();
    }

    const button1 = createTagClass("button", "mainfrmBtn1", "변환", form);
    const button2 = createTagClass("button", "mainfrmBtn2", "취소", form);

    append(document.body, formContainer);

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
            alert('좌측 상단의 흰색 상태 바를 더블 클릭하면 옵션 창을 열 수 있습니다.\n\n' +
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
                    img.src = createURL(blob);

                    return new Promise((resolve) => {
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            context.drawImage(img, 0, 0);

                            // blob 타입으로 변환한다.
                            canvas.toBlob((blob) => {
                                resolve(blob);
                                revokURL(img.src);
                            }, "image/png");
                        };
                        img.onerror = () => {
                            revokURL(img.src);
                        };
                    });
                } catch (error) {
                    console.error(error);
                    return false;
                }
            };

            const extractExtension = (url) => {
                // url 에서 확장자를 추출하는 함수
                return parseMatch(url.split("?")[0], /\.(\w{2,4}$)/);
            };

            const chkHeader = (buf) => {
                // 이미지 또는 영상 파일에서 헤더를 읽어 포멧이 무엇인지 판별하는 함수
                const fileSignatures = {
                    "png": [0x89, 0x50, 0x4E, 0x47],
                    "webp": [0x52, 0x49, 0x46, 0x46],
                    "jpg": [0xFF, 0xD8, 0xFF],
                    "tiff": [0x49, 0x49, 0x2A],
                    "tiff": [0x4D, 0x4D, 0x2A],
                    "gif": [0x47, 0x49, 0x46],
                    "bmp": [0x42, 0x4D]
                };

                // mp4 식별자가 들어간 경우
                if (String.fromCharCode.apply(null, buf).includes("ftyp"))
                    return "mp4";

                for (const [format, signature] of Object.entries(fileSignatures)) {
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
                    if (o.url.substr(0, 2) === "./")
                        o.url = new URL(o.url, currentURL).href;
                    o.url = addHttpMissing(o.url);
                    if ("mp4" === extractExtension(o.url))
                        ++mp4cnt;
                    if (proxy)
                        o.url = PROXY_SERV_URL.replaceAll("%%%ENCODEURL%%%", encodeURIComponent(o.url));
                };

                const find_tag = (name) => {
                    try {
                        const tag = document.getElementsByClassName(name);

                        if (tag.length <= 0)
                            return [];
                        if (tag[0].tagName.toLowerCase() === "img" ||
                            tag[0].tagName.toLowerCase() === "video")
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

                if ((gifConvChk.checked || pngConvChk.checked) &&
                    lossySelectCombo.value == 100 /* lossySelectCombo.value 는 문자열이라 == 연산자를 이용해 정수타입과 비교 */ &&
                    urls.length > 0 && domain === "arca.live") {
                    const match = parseMatch(currentURL, /e\/(\d+)/);

                    if (match) {
                        const res = await fetchErr(ARKA_API_URL.replaceAll("%%%EMOID%%%", match), {
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
                    const worker = async () => {
                        const response = await fetch(FFMPEG_CORE_JS_URL);
                        const jsCode = (await response.text()) + WORKER_ADDITION_CODE;
                        const blob = new Blob([jsCode], { type: 'application/javascript' });
                        return new Worker(createURL(blob));
                    };

                    for (let i = 0, j = Math.min(navigator.hardwareConcurrency, mp4cnt); i < j; ++i) {
                        // 스레드를 클라이언트 CPU 개수만큼 만든다 ( mp4가 별로 없으면 mp4 개수에 맞춤 )
                        const obj = await worker();

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

                const convertGif = (blob) => {
                    return new Promise(resolve => {
                        const fps = fpsSelectCombo.value;
                        const lossy = lossySelectCombo.value;
                        let filter;

                        if (lossy == 1)
                            filter = null;
                        else {
                            const lossyValue = Math.floor(lossy / 100 * 256);
                            const lossyOption = lossy >= 100 ? `palettegen` : `palettegen=max_colors=${lossyValue}`;
                            filter = `fps=${fps},scale=-1:-1:flags=lanczos,split [a][b];[a] ${lossyOption} [p];[b][p] paletteuse`;
                        }

                        ffmpegs.sort((a, b) => a.size - b.size);

                        const obj = ffmpegs[0]; // 상대적으로 작업량이 가벼운 worker를 분석해서 대기열에 추가
                        if (obj.queue.length <= 0)
                            sendQueueMsg(obj.obj, blob, filter);

                        obj.size += blob.size;
                        obj.queue.push({ blob: blob, filter: filter, resolve: resolve });
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
                        const hdr = chkHeader(new Uint8Array((await blob.arrayBuffer()).slice(0, 10)));

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
                    ffmpegs.map(e => e.obj.terminate());

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
                        setAttr(link, "class", "download");
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

                            append(f, popup);
                            setAttr(popup, "role", "dialog");
                            setAttr(popup, "aria-modal", "true");

                            const close_btn = createTagClass("button", "close-btn", null, popup);
                            setAttr(close_btn, "aria-label", "닫기");
                            setHTML(close_btn, "&times;");

                            e.stopPropagation();

                            setTimeout((popup, form, e) => {
                                // 화면 경계 보정
                                const formRect = form.getBoundingClientRect();
                                const popupWidth = popup.offsetWidth;
                                const popupHeight = popup.offsetHeight;
                                const scrollTop = form.scrollTop;
                                const scrollLeft = form.scrollLeft;
                                const clientX = e.clientX;
                                const clientY = e.clientY;
                                let relativeX = clientX - formRect.left;
                                let relativeY = clientY - formRect.top;

                                if (relativeX + popupWidth / 2 > formRect.width)
                                    relativeX = formRect.width - popupWidth / 2 - 8;

                                if (relativeX - popupWidth / 2 < 0)
                                    relativeX = popupWidth / 2 + 8;

                                if (relativeY + popupHeight > formRect.height)
                                    relativeY = formRect.height - popupHeight - 16;

                                relativeX += scrollLeft;
                                relativeY += scrollTop;

                                popup.style.left = relativeX + 'px';
                                popup.style.top = relativeY + 'px';

                                popup.classList.add('visible');
                            }, 10, popup, form, e);

                            close_btn.addEventListener('click', e => {
                                e.stopPropagation();
                                popup.remove();
                            });

                            document.addEventListener('click', e => {
                                // 바깥 클릭 시에만 닫기
                                if (!popup.contains(e.target)) {
                                    popup.remove();
                                }
                            });

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

                            img.classList.add("transp_bg");

                            if (endIndex) {
                                // 이것은 100x100 크기의 투명 이미지 입니다.
                                setAttr(img, "src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAWVJREFUeF7t00ERAAAIhECvf2lr7AMTMODtOsrAKJpgriDYExSkIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC0EC/KEzwBlGO+pQQAAAABJRU5ErkJggg==");
                                setAttr(img, "class", "gifEditfrmItemImg_");
                                setHTML(name, "일괄<br>적용");
                            } else {
                                setAttr(img, "src", _gif.url);
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

                            Array.from(buttonGroup.getElementsByClassName('gifEditfrmBtn')).forEach((btn, idx) => {
                                btn.addEventListener('click', async (e) => {
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
                                                        ``
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

                                                range1.onchange = function () {
                                                    setHTML(vlbl1, `${this.value}%`);
                                                };

                                                range3.onchange = function () {
                                                    setHTML(vlbl3, `${this.value}%`);
                                                };

                                                range4.onchange = function () {
                                                    setHTML(vlbl4, `${this.value}%`);
                                                };

                                                range5.onchange = function () {
                                                    setHTML(vlbl5, `${this.value}%`);
                                                };

                                                range6.onchange = function () {
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
                                                        Array.from({ length: gifs.length }, (_, i) => works.push(i));
                                                    else
                                                        works.push(itemIdx);

                                                    works.forEach(async e => {
                                                        const options = gifs[e].info.options;

                                                        options.speed.enable = checkbox1.checked;
                                                        options.speed.speed = parseInt(range1.value);
                                                        options.skipFrame.enable = checkbox2.checked;
                                                        options.skipFrame.skip = parseInt(textbox2.value);
                                                        options.skipFrame.frameCount = parseInt(textbox2_1.value);
                                                        options.brightnessFrame.enable = checkbox3.checked;
                                                        options.brightnessFrame.brightness = parseInt(range3.value);
                                                        options.sharpenFrame.enable = checkbox4.checked;
                                                        options.sharpenFrame.sharpen = parseInt(range4.value);
                                                        options.optimize.enable = checkbox5.checked;
                                                        options.optimize.threshold = parseInt(range5.value);
                                                        options.quality.enable = checkbox6.checked;
                                                        options.quality.quality = parseInt(range6.value);

                                                        if (gifs[e].endboundary)
                                                            return;

                                                        const arrayBuffer = await gifs[e].blob.arrayBuffer();
                                                        const editgifs = GIFS();
                                                        const changeGif = editgifs.changeGif;

                                                        changeGif({
                                                            buffer: arrayBuffer,
                                                            repeat: true,
                                                            quality: checkbox6.checked ? parseInt(range6.value) : 6,
                                                            percentSpeed: checkbox1.checked ? parseInt(range1.value) / 100 : null,
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
                                                    Array.from({ length: gifs.length - 1 }, (_, i) => works.push(i));
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
                            });

                            append(form, item);
                        });

                        append(document.body, form);
                    }
                });
            });
        })();

        formContainer.remove();
    });

    button2.addEventListener("click", () => {
        saveSettings(0);
        formContainer.remove();
        alert_tag.remove();
    });

    const autostart = localStorage.getItem(F366C_STR);

    if (autostart === "1")
        button1.click();
})();

