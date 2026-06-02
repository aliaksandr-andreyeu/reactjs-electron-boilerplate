import { useMutation } from '@tanstack/react-query';
import { getPlatform } from '@platform/registry';
import type { HttpRequestConfig, HttpResponse } from '@common/electronApi';

export function useHttpSend() {
  const { http } = getPlatform();

  return useMutation<HttpResponse, Error, HttpRequestConfig>({
    mutationFn: (config) => http.request(config),
  });
}
