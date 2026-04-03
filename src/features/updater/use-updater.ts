import { useEffect, useState } from "react";

import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "installing"
  | "restarting"
  | "up-to-date"
  | "error";

export interface UpdateProgress {
  status: UpdateStatus;
  version: string | null;
  downloaded: number;
  contentLength: number | null;
  error: string | null;
}

const INITIAL_STATE: UpdateProgress = {
  status: "idle",
  version: null,
  downloaded: 0,
  contentLength: null,
  error: null,
};

export const useUpdater = () => {
  const [progress, setProgress] = useState<UpdateProgress>(INITIAL_STATE);

  useEffect(() => {
    const runUpdate = async () => {
      setProgress((p) => ({ ...p, status: "checking" }));

      try {
        const update = await check();

        if (!update) {
          setProgress((p) => ({ ...p, status: "up-to-date" }));
          return;
        }

        setProgress((p) => ({
          ...p,
          status: "downloading",
          version: update.version,
        }));

        let totalDownloaded = 0;

        await update.downloadAndInstall((event) => {
          if (event.event === "Started") {
            setProgress((p) => ({
              ...p,
              contentLength: event.data.contentLength ?? null,
            }));
          } else if (event.event === "Progress") {
            totalDownloaded += event.data.chunkLength;
            setProgress((p) => ({
              ...p,
              downloaded: totalDownloaded,
            }));
          } else if (event.event === "Finished") {
            setProgress((p) => ({ ...p, status: "installing" }));
          }
        });

        setProgress((p) => ({ ...p, status: "restarting" }));
        await relaunch();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Update check failed";
        setProgress((p) => ({ ...p, status: "error", error: message }));
      }
    };

    void runUpdate();
  }, []);

  return progress;
};
