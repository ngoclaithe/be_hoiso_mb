import { Injectable } from '@nestjs/common';
import { config } from '../../config/config';
import { generateCloudinarySignature } from '../../common/helpers/cloudinary.helper';

@Injectable()
export class CloudinaryService {
  generateSignature(folder?: string, tags?: string, transformation?: any) {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const defaultFolder = `uploads/${new Date().getFullYear()}/${String(
      new Date().getMonth() + 1,
    ).padStart(2, '0')}`;

    const toTransformationString = (t: any): string => {
      if (!t) {
        return 'w_1200,h_1200,c_limit,q_auto:good,f_auto,dpr_auto,fl_progressive';
      }
      if (typeof t === 'string') return t;
      if (Array.isArray(t)) t = t[0];
      return [
        t.width ? `w_${t.width}` : '',
        t.height ? `h_${t.height}` : '',
        t.crop ? `c_${t.crop}` : '',
        t.quality ? `q_${t.quality}` : '',
        t.fetch_format ? `f_${t.fetch_format}` : '',
        t.dpr ? `dpr_${t.dpr}` : '',
        t.flags ? `fl_${t.flags}` : '',
      ]
        .filter(Boolean)
        .join(',');
    };

    const params = {
      timestamp,
      upload_preset: 'cdn',
      folder: folder || defaultFolder,
      tags: tags || 'web_upload,optimized',
      transformation: toTransformationString(transformation),
    };

    const signature = generateCloudinarySignature(params, config.CLOUD_API_SECRET);

    return {
      ...params,
      signature,
      api_key: config.CLOUD_API_KEY,
      cloud_name: config.CLOUD_NAME,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };
  }

  generateOptimizedUrls(publicId: string) {
    const baseUrl = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload`;

    return {
      original: `${baseUrl}/${publicId}`,
      optimized: `${baseUrl}/q_auto:good,f_auto,dpr_auto/${publicId}`,
      thumbnail: `${baseUrl}/w_300,h_300,c_fill,g_auto,q_auto:good,f_auto/${publicId}`,
      placeholder: `${baseUrl}/w_50,h_50,c_fill,q_auto:low,e_blur:1000,f_auto/${publicId}`,
      responsive: {
        mobile: `${baseUrl}/w_480,c_limit,q_auto:good,f_auto,dpr_auto/${publicId}`,
        tablet: `${baseUrl}/w_768,c_limit,q_auto:good,f_auto,dpr_auto/${publicId}`,
        desktop: `${baseUrl}/w_1200,c_limit,q_auto:good,f_auto,dpr_auto/${publicId}`,
        retina: `${baseUrl}/w_2400,c_limit,q_auto:good,f_auto,dpr_auto/${publicId}`,
      },
    };
  }
}
