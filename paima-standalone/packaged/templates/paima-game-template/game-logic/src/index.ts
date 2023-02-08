// mocked complicated server side logic
export const calculateProgress = (prevExperience: number, gainedExperience: number) => {
  return prevExperience + gainedExperience * 10;
};
