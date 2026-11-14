import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load biến môi trường từ file .env trong thư mục server
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Lỗi: Thiếu VITE_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env của server!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const SOURCE_DIR = 'D:\\free-exercise-db\\exercises';
const BUCKET_NAME = 'exercise-media';

// Import hoặc định nghĩa trực tiếp các cặp ánh xạ từ file exercise-media.map.ts
// Hoặc duyệt trực tiếp tất cả thư mục trong D:\free-exercise-db\exercises lên Supabase
async function uploadAllExerciseImages() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Không tìm thấy thư mục nguồn: ${SOURCE_DIR}`);
    return;
  }

  console.log('Bắt đầu quét và tải ảnh bài tập lên Supabase Storage...');
  const exerciseFolders = fs.readdirSync(SOURCE_DIR);
  let successCount = 0;

  for (const folder of exerciseFolders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
          const filePath = path.join(folderPath, file);
          const fileData = fs.readFileSync(filePath);
          const storagePath = `exercises/${folder}/${file}`;

          // Kiểm tra xem có cần ép kiểu content-type chuẩn không
          const ext = path.extname(file).replace('.', '');
          const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileData, {
              contentType: contentType,
              upsert: true
            });

          if (error) {
            console.error(`Lỗi upload ${storagePath}:`, error.message);
          } else {
            successCount++;
          }
        }
      }
    }
  }

  console.log(`--- Hoàn tất! Đã tải lên thành công ${successCount} file ảnh lên bucket '${BUCKET_NAME}' ---`);
}

uploadAllExerciseImages();