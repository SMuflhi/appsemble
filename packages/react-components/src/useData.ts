import axios, { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

export interface UseAxiosResult<T> {
  /**
   * The current data, if it has been loaded and no error has occurred.
   */
  data?: T;

  /**
   * The Axios error that occurred, if any.
   */
  error?: AxiosError;

  /**
   * An indicator whether the data is still being loading.
   */
  loading: boolean;

  /**
   * A function to reload the data.
   */
  refresh: () => void;

  /**
   * Override the data with new data.
   *
   * This may be useful if the data has been updated because of user interaction. E.g. a resource
   * has been updated or deleted.
   */
  setData: Dispatch<SetStateAction<T>>;
}

/**
 * Use data fetched from a remote API.
 *
 * Whenever the URL is changed, new data is loaded.
 *
 * @param target - Either the URL from which to fetch data, or a promise that returns T.
 *
 * @returns A state which holds the target data and some utility functions.
 */
export function useData<T>(target: string | (() => Promise<T>)): UseAxiosResult<T> {
  const [error, setError] = useState<AxiosError>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<T>(null);

  const [refresher, setRefresher] = useState<Record<string, unknown>>();

  const refresh = useCallback(() => setRefresher({}), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (typeof target === 'string') {
      const source = axios.CancelToken.source();
      axios
        .get(target, { cancelToken: source.token })
        .then(({ data }) => {
          setResult(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            setResult(null);
            setError(err);
            setLoading(false);
          }
        });

      return source.cancel;
    }

    target()
      .then((response) => {
        setResult(response);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setResult(null);
        setError(err);
        setLoading(false);
      });
  }, [refresher, target]);

  return useMemo(
    () => ({
      loading,
      error,
      data: result,
      refresh,
      setData(data: T) {
        setResult(data);
        setError(null);
        setLoading(false);
      },
    }),
    [error, loading, refresh, result],
  );
}
