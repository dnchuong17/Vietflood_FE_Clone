export type ReportFormValues = {
  categories: string[];
  description: string;
  province: string;
  ward: string;
  addressLine: string;
  lat: string;
  lng: string;
  isLocationManuallyEdited?: boolean;
  files?: FileList | null;
};

export function buildReportFormData(values: ReportFormValues): FormData {
  const formData = new FormData();
  const categories = values.categories.length > 0 ? values.categories : ["flood"];

  for (const category of categories) {
    formData.append("category", category);
  }
  if (categories.length === 1) {
    formData.append("category", categories[0]);
  }

  formData.append("description", values.description);
  formData.append("province", values.province);
  formData.append("ward", values.ward);
  formData.append("addressLine", values.addressLine);
  if (values.lat.trim() && values.lng.trim()) {
    formData.append("lat", values.lat.trim());
    formData.append("lng", values.lng.trim());
  }

  Array.from(values.files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  return formData;
}
