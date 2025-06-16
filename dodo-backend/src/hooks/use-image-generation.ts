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
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['images'] });
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['images'], (old: any) => {
        if (!old) return [data];
        return [...old, data];
      });
      toast.success('Image generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate image');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });

  return mutation;
}; 