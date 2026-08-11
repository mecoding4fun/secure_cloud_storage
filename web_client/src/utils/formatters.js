export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (!bytes) return "--";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "--";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};
