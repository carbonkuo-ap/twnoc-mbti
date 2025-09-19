import create from "zustand";

interface TestTimerState {
  testStartTime: number | null;
  setTestStartTime: (startTime: number) => void;
  resetTestTimer: () => void;
}

const useTestTimerStore = create<TestTimerState>((set) => ({
  testStartTime: null,
  setTestStartTime: (startTime) =>
    set(() => ({
      testStartTime: startTime,
    })),
  resetTestTimer: () =>
    set(() => ({
      testStartTime: null,
    })),
}));

export default useTestTimerStore;