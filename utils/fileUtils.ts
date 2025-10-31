export const fileToGenerativePart = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as data URL."));
      }
      // The result is a data URL like "data:image/jpeg;base64,LzlqLzRB..."
      // We need to extract the mimeType and the base64 data.
      const [header, data] = reader.result.split(',');
      if (!header || !data) {
        return reject(new Error("Invalid data URL format."));
      }
      const mimeTypeMatch = header.match(/:(.*?);/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        return reject(new Error("Could not extract MIME type from data URL."));
      }
      const mimeType = mimeTypeMatch[1];
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
