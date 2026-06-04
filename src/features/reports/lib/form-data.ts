export type ReportFormValues = {
  categories: string[];
  description: string;
  province: string;
  ward: string;
  addressLine: string;
  lat: string;
  lng: string;
  severity: string;
  isUrgent: boolean;
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
  if (!values.isLocationManuallyEdited) {
    formData.append("lat", values.lat);
    formData.append("lng", values.lng);
    formData.append("latitude", values.lat);
    formData.append("longitude", values.lng);
  }
  formData.append("severity", values.severity);
  formData.append("isUrgent", String(values.isUrgent));

  Array.from(values.files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  return formData;
}
