import { useEffect, useState } from "react";
import type { User } from "@/components/Navbar";

export function useFetchData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
         if (!url) return; 
        const res = await fetch(url, { method: "GET", credentials: "include",  headers: {
    "Content-Type": "application/json",
  }, });
        if (!res.ok) throw new Error("Erreur serveur");
        const json = (await res.json()) as T;
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}


export function usePostData<T, R = any>(url: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<R | null>(null);

  // Fonction déclenchée par le composant/payload en entréé pour envoyer plusieurs types de données
  const postData = async (payload: T): Promise<R | void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { postData, data, loading, error };
}
//fonction génerique pour des requetes Update et delete
export function useSendData<T, R = any>(url: string, method: "PUT" | "DELETE") {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<R | null>(null);

  const sendData = async (payload?: T): Promise<R | void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur innatendue : ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendData, data, loading, error };
}
//interface users 
export interface Users extends User{
  _id: string,
  numero: string,
  dateNaissance: string
}

