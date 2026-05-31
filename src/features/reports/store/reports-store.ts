import { create } from "zustand";

import type { FloodReport, ReportStatus } from "../api/reports";

type ReportsStore = {
  reports: FloodReport[];
  isLoading: boolean;
  filter: "all" | ReportStatus;
  query: string;
  isCreating: boolean;
  editingReport: FloodReport | null;
  savingStatusByReportId: Record<number, ReportStatus>;
  setReports: (reports: FloodReport[]) => void;
  setLoading: (isLoading: boolean) => void;
  setFilter: (filter: "all" | ReportStatus) => void;
  setQuery: (query: string) => void;
  setCreating: (isCreating: boolean) => void;
  setEditingReport: (report: FloodReport | null) => void;
  startReportStatusSave: (reportId: number, status: ReportStatus) => void;
  rollbackReportStatus: (reportId: number, previousStatus: ReportStatus) => void;
  finishReportStatusSave: (reportId: number) => void;
};

const initialState = {
  reports: [] as FloodReport[],
  isLoading: true,
  filter: "all" as const,
  query: "",
  isCreating: false,
  editingReport: null,
  savingStatusByReportId: {} as Record<number, ReportStatus>,
};

export const useReportsStore = create<ReportsStore>()((set) => ({
  ...initialState,
  setReports: (reports) => set({ reports }),
  setLoading: (isLoading) => set({ isLoading }),
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
  setCreating: (isCreating) => set({ isCreating }),
  setEditingReport: (editingReport) => set({ editingReport }),
  startReportStatusSave: (reportId, status) =>
    set((state) => ({
      reports: state.reports.map((report) =>
        report.id === reportId ? { ...report, status } : report,
      ),
      savingStatusByReportId: {
        ...state.savingStatusByReportId,
        [reportId]: status,
      },
    })),
  rollbackReportStatus: (reportId, previousStatus) =>
    set((state) => ({
      reports: state.reports.map((report) =>
        report.id === reportId ? { ...report, status: previousStatus } : report,
      ),
    })),
  finishReportStatusSave: (reportId) =>
    set((state) => {
      const nextSaving = { ...state.savingStatusByReportId };
      delete nextSaving[reportId];
      return { savingStatusByReportId: nextSaving };
    }),
}));

export function resetReportsStore() {
  useReportsStore.setState({
    ...initialState,
    savingStatusByReportId: {},
  });
}
