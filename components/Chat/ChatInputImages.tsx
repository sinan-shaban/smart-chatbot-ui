import { IconPhotoFilled, IconX } from '@tabler/icons-react';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface InputImage {
  id: string;
  content: string;
}

interface Props {
  images: InputImage[];
  onImagesChange: (images: InputImage[]) => void;
}

const convertBase64 = (file: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
      resolve(fileReader.result);
    };

    fileReader.onerror = (error) => {
      reject(error);
    };
  });
};

export const ChatInputImages = ({ images, onImagesChange }: Props) => {
  const inputFileRef = useRef<any>(null);

  const onSelectImageClick = () => {
    inputFileRef.current?.click();
  };

  const onImagesSelected = async (event: any) => {
    const images = [];
    for (const file of event.target.files) {
      const content = await convertBase64(file);
      images.push({
        id: uuidv4(),
        content: content,
      });
    }

    onImagesChange(images);
    inputFileRef.current.value = null;
  };

  const onRemoveImage = (id: string) => () => {
    onImagesChange(images.filter((image) => image.id !== id));
  };

  return (
    <>
      {images.length ? (
        <div style={{ height: '100px', padding: '8px', display: 'flex' }}>
          {images.map((image, index) => {
            return (
              <div key={index} style={{ position: 'relative', marginRight: '4px' }}>
                <div
                  onClick={onRemoveImage(image.id)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    cursor: 'pointer',
                    backgroundColor: '#000'
                  }}
                >
                  <IconX size={20} />
                </div>
                <img
                  alt={`image-${index}`}
                  src={image.content}
                  style={{ height: '100%', width: 'auto' }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}

      <input
        ref={inputFileRef}
        accept=".jpg, .jpeg, .png, .gif, .webp"
        multiple
        type="file"
        name="file"
        style={{ display: 'none' }}
        onChange={onImagesSelected}
      />

      <button
        style={images.length ? { top: 'calc(100px + 0.5rem)' } : {}}
        className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
        onClick={onSelectImageClick}
        onKeyDown={(e) => {}}
      >
        <IconPhotoFilled size={20} />
      </button>
    </>
  );
};