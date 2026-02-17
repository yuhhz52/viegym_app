// Helper functions to translate English values to Vietnamese

export const translateGender = (gender: string | null | undefined): string => {
  if (!gender) return "Chưa cập nhật";
  const genderMap: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };
  return genderMap[gender.toUpperCase()] || gender;
};

export const translateExperienceLevel = (level: string | null | undefined): string => {
  if (!level) return "Chưa cập nhật";
  const levelMap: Record<string, string> = {
    BEGINNER: "Người mới bắt đầu",
    INTERMEDIATE: "Trung bình",
    ADVANCED: "Nâng cao",
    EXPERT: "Chuyên gia",
  };
  return levelMap[level.toUpperCase()] || level;
};

export const translateGoal = (goal: string | null | undefined): string => {
  if (!goal) return "Chưa cập nhật";
  const goalMap: Record<string, string> = {
    LOSE_WEIGHT: "Giảm cân",
    BUILD_MUSCLE: "Tăng cơ",
    MAINTAIN: "Duy trì",
    IMPROVE_ENDURANCE: "Cải thiện sức bền",
  };
  return goalMap[goal.toUpperCase()] || goal;
};

