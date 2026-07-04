import React, { useState, useEffect } from "react";
import {
  Save,
  FolderSearch,
  Globe,
  FileSpreadsheet,
  Server,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface SettingsPageProps {
  onConfigSaved: () => void;
}

export default function SettingsPage({ onConfigSaved }: SettingsPageProps) {
  const [config, setConfig] = useState<{
    activeDataPath: string;
    serverAddress: string;
    excelExportPath: string;
    cwd?: string;
  }>({
    activeDataPath: "",
    serverAddress: "",
    excelExportPath: "",
    cwd: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedConfigStr = localStorage.getItem("app_config");
      if (savedConfigStr) {
        const savedConfig = JSON.parse(savedConfigStr);
        setConfig({
          activeDataPath: savedConfig.activeDataPath || "",
          serverAddress: savedConfig.serverAddress || "http://localhost:3005",
          excelExportPath: savedConfig.excelExportPath || "",
          cwd: savedConfig.cwd || "",
        });
      }
    } catch (err) {
      console.error("Failed to load local config", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (field: keyof typeof config, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      localStorage.setItem("app_config", JSON.stringify(config));

      // @ts-ignore
      const isTauri = !!(window.__TAURI_INTERNALS__ || window.__TAURI_IPC__);
      if (isTauri && config.activeDataPath) {
        // @ts-ignore
        const { invoke } = await import("@tauri-apps/api/core");
        // Rust 측 get_server_config가 참조하는 server_config.json에도 반영해
        // 다음 실행 시 설정화면으로 강제 전환되지 않도록 한다.
        await invoke("update_server_config", {
          activePath: config.activeDataPath,
        }).catch((e: any) => console.warn("Failed to persist server config to Rust side:", e));
      }

      setSaveMessage({
        type: "success",
        text: "설정이 성공적으로 저장되었습니다. 데스크톱 앱일 경우 부분 재시작이 필요할 수 있습니다.",
      });
      onConfigSaved();
    } catch (e: any) {
      setSaveMessage({
        type: "error",
        text: e.message || "저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrowse = async (
    field: "activeDataPath" | "excelExportPath",
    isDirectory: boolean = false,
  ) => {
    // Check if in Tauri environment
    // @ts-ignore
    if (window.__TAURI_INTERNALS__ || window.__TAURI_IPC__) {
      try {
        // @ts-ignore
        const { open } = await import("@tauri-apps/plugin-dialog");
        const defaultPath = config.cwd || undefined;

        const selected = await open({
          directory: isDirectory,
          multiple: false,
          defaultPath,
          filters: !isDirectory
            ? [{ name: "JSON Data", extensions: ["json"] }]
            : undefined,
        });

        if (selected && !Array.isArray(selected)) {
          handleChange(field, selected);
        }
      } catch (err) {
        console.error("Tauri dialog error:", err);
        alert("파일 탐색기를 여는 중 오류가 발생했습니다.");
      }
    } else {
      alert(
        "데스크톱 앱(Tauri) 환경에서만 로컬 파일 파일 탐색기를 사용할 수 있습니다. 웹 브라우저 환경에서는 직접 경로를 입력해주세요.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-brand-on-surface-variant text-sm">
        설정 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-brand-surface-lowest">
      <div className="p-8 max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-brand-on-surface mb-2 font-title-md">
          환경 설정
        </h2>
        <p className="text-sm text-brand-on-surface-variant mb-8">
          다중 사용자 동기화 데이터 경로, 서버 주소, 내보내기 위치 등을 설정할
          수 있습니다.
        </p>

        <div className="space-y-6">
          {/* Server Data Path */}
          <div className="bg-brand-surface border border-brand-outline-variant p-5 rounded-xl">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-brand-primary" />
              서버 데이터 (Data) 저장 경로
            </h3>
            <p className="text-xs text-brand-on-surface-variant mb-3">
              요구조건 목록과 담당자 풀을 동기화할 메인 JSON 파일의 공용 경로를
              지정합니다. 다중 사용자가 같은 파일을 바라보도록 설정하세요.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.activeDataPath}
                onChange={(e) => handleChange("activeDataPath", e.target.value)}
                placeholder="예: C:\SharedData\workspace_active.json"
                className="flex-1 bg-brand-surface-lowest border border-brand-outline-variant px-3 py-2.5 rounded-lg text-sm text-brand-on-surface focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={() => handleBrowse("activeDataPath", false)}
                className="bg-brand-surface-high border border-brand-outline-variant hover:bg-brand-surface-highest text-brand-on-surface px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <FolderSearch className="w-4 h-4" />
                찾아보기
              </button>
            </div>
            {config.cwd && (
              <p className="text-[10px] text-brand-on-surface-variant mt-2">
                기본 실행 경로:{" "}
                <code className="bg-brand-surface-lowest px-1 rounded">
                  {config.cwd}
                </code>
              </p>
            )}
          </div>

          {/* Excel Export Path */}
          <div className="bg-brand-surface border border-brand-outline-variant p-5 rounded-xl">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Excel 추출 기본 위치
            </h3>
            <p className="text-xs text-brand-on-surface-variant mb-3">
              시트를 Excel 파일로 내보낼 때 기본적으로 저장될 폴더 경로를
              지정합니다.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.excelExportPath}
                onChange={(e) =>
                  handleChange("excelExportPath", e.target.value)
                }
                placeholder="예: C:\Users\Username\Documents"
                className="flex-1 bg-brand-surface-lowest border border-brand-outline-variant px-3 py-2.5 rounded-lg text-sm text-brand-on-surface focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleBrowse("excelExportPath", true)}
                className="bg-brand-surface-high border border-brand-outline-variant hover:bg-brand-surface-highest text-brand-on-surface px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <FolderSearch className="w-4 h-4" />
                폴더 선택
              </button>
            </div>
          </div>

          {/* Admin Setup Scaffolding Tool */}
          <div className="bg-brand-surface border border-brand-outline-variant p-5 rounded-xl">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-brand-primary">
              <Server className="w-4 h-4" />
              네트워크/NAS 원 클릭 인프라 설치 (Scaffolding Tool)
            </h3>
            <p className="text-xs text-brand-on-surface-variant mb-4">
              빈 공유 폴더에 이 데스크톱 앱을 복사해 두었다면, 이 버튼을 통해
              데이터베이스 거점(locks, changelogs, data 폴더 등)을 일괄 생성하여
              실시간 충돌 방지 시스템을 초기화할 수 있습니다.
            </p>
            <button
              onClick={async () => {
                // @ts-ignore
                if (window.__TAURI_INTERNALS__ || window.__TAURI_IPC__) {
                  const d = new Date();
                  const yy = String(d.getFullYear()).slice(-2);
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  const todayStr = `${yy}${mm}${dd}`;

                  const projectName = prompt(
                    "프로젝트 명칭을 입력하세요\n(입력된 명칭에 따라 data 저장소가 '{명칭}.json'으로 자동 설정됩니다.)",
                    `프로젝트_${todayStr}`,
                  );
                  if (!projectName) {
                    return; // cancelled
                  }

                  try {
                    // @ts-ignore
                    const { invoke } = await import("@tauri-apps/api/core");
                    const res: any = await invoke(
                      "admin_setup_server_environment",
                      { projectName },
                    );
                    console.log("Setup result:", res);

                    setConfig((prev) => ({
                      ...prev,
                      activeDataPath: res.activeDataPath,
                      excelExportPath: res.exportDir,
                    }));
                    setSaveMessage({
                      type: "success",
                      text: `[${projectName}] 인프라가 성공적으로 스캐폴딩 되었습니다.\n생성된 경로들을 동기화하려면 [설정 저장] 버튼을 누르세요.`,
                    });
                  } catch (e: any) {
                    console.error("Setup failed", e);
                    setSaveMessage({
                      type: "error",
                      text: `설치 중 오류가 발생했습니다: ${e.message || e}`,
                    });
                  }
                } else {
                  alert(
                    "데스크톱 앱(Tauri) 환경에서만 사용 가능한 관리자 시스템입니다.",
                  );
                }
              }}
              className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer w-full text-center"
            >
              🚀 네트워크/NAS 원 클릭 인프라 설치
            </button>
          </div>
        </div>

        {/* Save Controls */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 bg-brand-primary text-brand-on-primary rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${
              isSaving
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-90 cursor-pointer"
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? "저장 중..." : "설정 저장"}
          </button>

          {saveMessage && (
            <div
              className={`text-sm flex items-center gap-2 ${saveMessage.type === "success" ? "text-brand-success" : "text-brand-error"}`}
            >
              {saveMessage.type === "error" && (
                <AlertCircle className="w-4 h-4" />
              )}
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
