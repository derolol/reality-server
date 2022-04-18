const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { logger } = require('../middlewares/logger');

class ImageUtil {

  uploadImage(image, currentPath, type, format) {
    // 获取base64编码
    let base64Code = image.split("base64,")[1];
    let buffer = Buffer.from(base64Code, "base64");
    // 获取存储对应类型图片的文件夹
    let imagePath = "";
    if (type & IMAGE_TYPE.MAP_PREVIEW) {
      imagePath = "preview";
    }
    else if (type & IMAGE_TYPE.POI_LOGO) {
      imagePath = "poi";
    }
    else if (type & IMAGE_TYPE.USER_PROFILE) {
      imagePath = "profile";
    }
    // 获取响应文件夹的绝对路径
    let filePath = path.resolve(process.cwd(), STATIC_PATH, imagePath);
    // 判断路径是否存在且是否指向文件
    if (fs.existsSync(path.join(filePath, currentPath))) {
      const fileState = fs.statSync(path.join(filePath, currentPath));
      currentPath = fileState.isFile() ? currentPath : `${uuidv4()}.${format}`;
    }
    filePath = path.join(filePath, currentPath);
    fs.writeFileSync(filePath, buffer, { flag: "w+" });
    return currentPath;
  }

  readImageBase64(currentPath, type, format) {
    // 获取存储对应类型图片的文件夹
    let imagePath = "";
    if (type & IMAGE_TYPE.MAP_PREVIEW) {
      imagePath = "preview";
    }
    else if (type & IMAGE_TYPE.POI_LOGO) {
      imagePath = "poi";
    }
    else if (type & IMAGE_TYPE.USER_PROFILE) {
      imagePath = "profile";
    }
    // 获取响应文件夹的绝对路径
    let filePath = path.resolve(process.cwd(), STATIC_PATH, imagePath);
    // 判断路径是否存在且是否指向文件
    if (!fs.existsSync(path.join(filePath, currentPath))) return "";
    const fileState = fs.statSync(path.join(filePath, currentPath));
    if (!fileState.isFile()) return "";
    // 获取图片路径
    filePath = path.join(filePath, currentPath);
    // 读取图片
    let buffers = fs.readFileSync(filePath);
    return `data:image/${format};base64,${Buffer.from(buffers).toString('base64')}`;
  }
}

const STATIC_PATH = "./public/static";

const IMAGE_TYPE = {
  MAP_PREVIEW: 1,
  POI_LOGO: 1 << 2,
  USER_PROFILE: 1 << 3,
}

const instance = new ImageUtil();

module.exports = {
  instance,
  IMAGE_TYPE,
};