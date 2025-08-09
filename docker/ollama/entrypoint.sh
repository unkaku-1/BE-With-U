#!/bin/bash

# BEwithU Ollama 启动脚本
# 自动下载和配置推荐的LLM模型

echo "🚀 启动 BEwithU Ollama 服务..."

# 启动Ollama服务
ollama serve &
OLLAMA_PID=$!

# 等待Ollama服务启动
echo "⏳ 等待 Ollama 服务启动..."
sleep 10

# 检查Ollama是否正常运行
while ! curl -f http://localhost:11434/api/tags >/dev/null 2>&1; do
    echo "⏳ 等待 Ollama 服务就绪..."
    sleep 5
done

echo "✅ Ollama 服务已启动"

# 下载推荐的模型
echo "📥 开始下载推荐的 LLM 模型..."

# 主要模型：Llama 3.1 8B（通用对话）
if ! ollama list | grep -q "llama3.1:8b"; then
    echo "📥 下载 Llama 3.1 8B 模型（通用对话）..."
    ollama pull llama3.1:8b
    echo "✅ Llama 3.1 8B 模型下载完成"
else
    echo "✅ Llama 3.1 8B 模型已存在"
fi

# 中文优化模型：Qwen2 7B
if ! ollama list | grep -q "qwen2:7b"; then
    echo "📥 下载 Qwen2 7B 模型（中文优化）..."
    ollama pull qwen2:7b
    echo "✅ Qwen2 7B 模型下载完成"
else
    echo "✅ Qwen2 7B 模型已存在"
fi

# 代码和推理模型：Mistral 7B
if ! ollama list | grep -q "mistral:7b"; then
    echo "📥 下载 Mistral 7B 模型（代码和推理）..."
    ollama pull mistral:7b
    echo "✅ Mistral 7B 模型下载完成"
else
    echo "✅ Mistral 7B 模型已存在"
fi

# 轻量级模型：Phi-3 Mini（快速响应）
if ! ollama list | grep -q "phi3:mini"; then
    echo "📥 下载 Phi-3 Mini 模型（快速响应）..."
    ollama pull phi3:mini
    echo "✅ Phi-3 Mini 模型下载完成"
else
    echo "✅ Phi-3 Mini 模型已存在"
fi

echo "🎉 所有推荐模型下载完成！"

# 显示已安装的模型
echo "📋 已安装的模型列表："
ollama list

# 创建模型配置文件
cat > /root/.ollama/models.json << EOF
{
  "models": {
    "primary": {
      "name": "llama3.1:8b",
      "description": "主要对话模型，适用于一般查询和对话",
      "use_case": "general_chat",
      "languages": ["ja", "en", "zh"]
    },
    "chinese": {
      "name": "qwen2:7b", 
      "description": "中文优化模型，适用于中文内容处理",
      "use_case": "chinese_content",
      "languages": ["zh", "ja", "en"]
    },
    "code": {
      "name": "mistral:7b",
      "description": "代码和推理模型，适用于技术问题",
      "use_case": "technical_support",
      "languages": ["en", "ja"]
    },
    "fast": {
      "name": "phi3:mini",
      "description": "轻量级快速响应模型",
      "use_case": "quick_response",
      "languages": ["en", "ja"]
    }
  },
  "default_model": "llama3.1:8b",
  "fallback_model": "phi3:mini"
}
EOF

echo "📝 模型配置文件已创建"

# 测试模型是否正常工作
echo "🧪 测试模型功能..."

# 测试主要模型
echo "Testing primary model..." | ollama run llama3.1:8b "Please respond with 'Model test successful' if you can understand this message."

echo "🎯 BEwithU Ollama 服务配置完成！"
echo "🌐 API 端点: http://localhost:11434"
echo "📚 可用模型: llama3.1:8b, qwen2:7b, mistral:7b, phi3:mini"

# 保持Ollama服务运行
wait $OLLAMA_PID

