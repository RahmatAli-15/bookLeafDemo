import { useEffect, useState } from "react";
import { apiService } from "../services/api";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService
      .listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}
