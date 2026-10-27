// Capacitor Android features; browsers keep the normal Web Speech API.
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const supported=Capacitor.isNativePlatform();
window.__kaoyanNativeTTS={
  supported,
  async speak(text,lang='en-US',rate=0.88){
    await TextToSpeech.stop().catch(()=>{});
    await TextToSpeech.speak({text,lang,rate,pitch:1,volume:1,queueStrategy:0});
  }
};
window.__kaoyanNativeExport={
  supported,
  async export(filename,text){
    await Filesystem.writeFile({path:filename,data:text,encoding:Encoding.UTF8,directory:Directory.Cache});
    const item=await Filesystem.getUri({path:filename,directory:Directory.Cache});
    await Share.share({title:'考研词汇学习记录',url:item.uri,dialogTitle:'保存或分享学习记录'});
  }
};
