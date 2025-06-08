import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateImage } from '@/services/imageService';
import { toast } from 'sonner';

interface GenerateImageParams {
  prompt: string;
  apiKey: string;
}

export const useImageGeneration = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: GenerateImageParams) => generateImage(params.prompt, params.apiKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['images'], (old: any) => {
        return old ? [...old, data] : [data];
      });
      toast.success('Image generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate image');
    },
  });

  return mutation;
}; 