import { AI, Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execPromise = promisify(exec);
const logPath = path.join(os.tmpdir(), "raycast-ai-translator-debug.log");

// 清空日志文件
fs.writeFileSync(logPath, "");

function logToFile(message: string) {
  fs.appendFileSync(logPath, `${new Date().toISOString()}: ${message}\n`);
}

export default async function Command() {
  logToFile("==== 开始执行命令 ====");
  
  try {
    const targetLanguage = "英语";
    logToFile(`目标语言: ${targetLanguage}`);

    // 保存当前剪贴板内容
    logToFile("正在读取当前剪贴板内容");
    const previousClipboard = await Clipboard.read();
    logToFile(`剪贴板类型: ${previousClipboard.type}`);
    logToFile(`剪贴板内容长度: ${previousClipboard.text?.length || 0}`);

    // 模拟全选
    logToFile("正在执行全选操作 (Cmd+A)");
    try {
      const { stdout, stderr } = await execPromise('osascript -e \'tell application "System Events" to keystroke "a" using command down\'');
      logToFile(`全选操作stdout: ${stdout}`);
      if (stderr) logToFile(`全选操作stderr: ${stderr}`);
    } catch (error) {
      logToFile(`全选操作失败: ${error}`);
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300)); // 增加延迟
    logToFile("全选操作延迟完成");

    // 模拟复制
    logToFile("正在执行复制操作 (Cmd+C)");
    try {
      const { stdout, stderr } = await execPromise('osascript -e \'tell application "System Events" to keystroke "c" using command down\'');
      logToFile(`复制操作stdout: ${stdout}`);
      if (stderr) logToFile(`复制操作stderr: ${stderr}`);
    } catch (error) {
      logToFile(`复制操作失败: ${error}`);
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300)); // 增加延迟
    logToFile("复制操作延迟完成");

    // 获取选中的文本
    logToFile("正在获取剪贴板内容");
    const selectedText = await Clipboard.read();
    logToFile(`选中文本类型: ${selectedText.type}`);
    logToFile(`选中文本长度: ${selectedText.text?.length || 0}`);
    
    if (!selectedText.text || selectedText.text.trim() === "") {
      logToFile("未选中文本，操作终止");
      await showToast({
        style: Toast.Style.Failure,
        title: "未选中文本",
        message: "请确保有文本被选中",
      });
      logToFile("正在恢复原始剪贴板");
      await Clipboard.paste(previousClipboard);
      return;
    }

    // 显示处理中提示
    logToFile("显示翻译中提示");
    await showHUD("正在翻译...");

    // 使用更明确的提示词
    const prompt = `
任务: 将以下中文文本翻译成英文
要求: 
1. 保持原始格式和段落结构
2. 保持专业术语的准确性
3. 只返回翻译结果，不要添加任何解释或注释

原文:
${selectedText.text}
`;
    logToFile(`AI提示词长度: ${prompt.length}`);
    logToFile(`AI提示词内容: ${prompt.substring(0, 200)}...`);
    logToFile("正在调用AI API");
    
    let translatedText;
    try {
      translatedText = await AI.ask(prompt);
      logToFile(`翻译结果长度: ${translatedText.length}`);
      logToFile(`翻译结果内容: ${translatedText.substring(0, 200)}...`);
      
      // 显示翻译结果预览
      await showToast({
        style: Toast.Style.Success,
        title: "翻译结果预览",
        message: translatedText.substring(0, 50) + "...",
      });
    } catch (error) {
      logToFile(`AI API调用失败: ${error}`);
      throw error;
    }

    // 将翻译后的文本复制到剪贴板
    logToFile("正在复制翻译结果到剪贴板");
    await Clipboard.copy(translatedText);
    
    // 验证剪贴板内容
    const clipboardAfterCopy = await Clipboard.read();
    logToFile(`复制后剪贴板内容长度: ${clipboardAfterCopy.text?.length || 0}`);
    logToFile(`复制后剪贴板内容: ${clipboardAfterCopy.text?.substring(0, 200)}...`);

    // 使用增强版AppleScript执行粘贴
    logToFile("正在使用增强版AppleScript执行粘贴操作");
    try {
      const script = `
        tell application "System Events"
          keystroke "v" using command down
          delay 0.5
        end tell
      `;
      const { stdout, stderr } = await execPromise(`osascript -e '${script}'`);
      logToFile(`粘贴操作stdout: ${stdout}`);
      if (stderr) logToFile(`粘贴操作stderr: ${stderr}`);
    } catch (error) {
      logToFile(`粘贴操作失败: ${error}`);
      throw error;
    }

    // 显示成功提示
    logToFile("显示翻译完成提示");
    await showHUD("翻译完成");

    // 延迟后恢复原始剪贴板内容
    logToFile("设置定时器恢复原始剪贴板");
    setTimeout(async () => {
      try {
        logToFile("正在恢复原始剪贴板");
        await Clipboard.paste(previousClipboard);
        logToFile("剪贴板恢复完成");
      } catch (error) {
        logToFile(`剪贴板恢复失败: ${error}`);
      }
    }, 800); // 增加延迟

    logToFile("==== 命令执行完成 ====");
  } catch (error) {
    logToFile(`发生错误: ${error}`);
    logToFile(`错误堆栈: ${error.stack}`);
    console.error(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "翻译失败",
      message: String(error),
    });
  }
}
