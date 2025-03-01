import { AI, Clipboard, showHUD, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// 定义插件首选项类型（如果您还没有设置首选项，可以先注释掉这部分）
// interface Preferences {
//   targetLanguage: string;
// }

export default async function AITextAutomation() {
  try {
    // 如果您设置了首选项，可以取消下面两行的注释
    // const preferences = getPreferenceValues<Preferences>();
    // const targetLanguage = preferences.targetLanguage || "英语";
    
    // 使用固定的目标语言（您可以稍后添加首选项）
    const targetLanguage = "英语";

    // 保存当前剪贴板内容，以便稍后恢复
    const previousClipboard = await Clipboard.read();

    // 模拟 Cmd+A (全选) 然后 Cmd+C (复制)
    await execPromise('osascript -e \'tell application "System Events" to keystroke "a" using command down\'');
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟确保全选完成
    await execPromise('osascript -e \'tell application "System Events" to keystroke "c" using command down\'');
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟确保复制完成

    // 获取选中的文本
    const selectedText = await Clipboard.read();
    
    if (!selectedText.text || selectedText.text.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "未选中文本",
        message: "请确保有文本被选中",
      });
      // 恢复原始剪贴板
      await Clipboard.paste(previousClipboard);
      return;
    }

    // 显示处理中提示
    await showHUD("正在翻译...");

    // 使用 AI API 处理文本
    const prompt = `将以下文本翻译成${targetLanguage}，保持原始格式：\n\n${selectedText.text}`;
    const translatedText = await AI.ask(prompt);

    // 将翻译后的文本复制到剪贴板
    await Clipboard.copy(translatedText);

    // 模拟 Cmd+V (粘贴) 替换原文本
    await execPromise('osascript -e \'tell application "System Events" to keystroke "v" using command down\'');

    // 显示成功提示
    await showHUD("翻译完成");

    // 延迟后恢复原始剪贴板内容
    setTimeout(async () => {
      await Clipboard.paste(previousClipboard);
    }, 500);

  } catch (error) {
    console.error(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "翻译失败",
      message: String(error),
    });
  }
}
