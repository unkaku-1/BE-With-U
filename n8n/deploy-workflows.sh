#!/bin/bash

# BEwithU n8n Workflow Deployment Script
# This script imports all workflows into n8n

set -e

# Configuration
N8N_URL="${N8N_URL:-http://localhost:5678}"
N8N_USER="${N8N_USER:-admin}"
N8N_PASSWORD="${N8N_PASSWORD:-admin}"
WORKFLOWS_DIR="$(dirname "$0")/workflows"

echo "🚀 Starting BEwithU n8n workflow deployment..."

# Check if n8n is running
echo "📡 Checking n8n connectivity..."
if ! curl -s "$N8N_URL/healthz" > /dev/null; then
    echo "❌ Error: n8n is not accessible at $N8N_URL"
    echo "Please ensure n8n is running and accessible."
    exit 1
fi

echo "✅ n8n is accessible"

# Function to import workflow
import_workflow() {
    local workflow_file="$1"
    local workflow_name=$(basename "$workflow_file" .json)
    
    echo "📥 Importing workflow: $workflow_name"
    
    # Import workflow using n8n CLI or API
    if command -v n8n > /dev/null; then
        # Using n8n CLI
        n8n import:workflow --input="$workflow_file"
    else
        # Using API (requires authentication setup)
        echo "⚠️  n8n CLI not available. Please import manually:"
        echo "   File: $workflow_file"
    fi
}

# Import all workflows
echo "📂 Importing workflows from $WORKFLOWS_DIR"

if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "❌ Error: Workflows directory not found: $WORKFLOWS_DIR"
    exit 1
fi

workflow_count=0
for workflow_file in "$WORKFLOWS_DIR"/*.json; do
    if [ -f "$workflow_file" ]; then
        import_workflow "$workflow_file"
        ((workflow_count++))
    fi
done

echo "✅ Successfully processed $workflow_count workflows"

# Setup instructions
cat << EOF

🎉 Workflow deployment completed!

📋 Next steps:
1. Access n8n at: $N8N_URL
2. Login with your credentials
3. Activate the imported workflows:
   - BEwithU - Intelligent Q&A Workflow
   - BEwithU - Ticket Automation Workflow  
   - BEwithU - Knowledge Management Workflow
   - BEwithU - System Monitoring Workflow

🔧 Configuration required:
1. Set up API credentials for BEwithU API
2. Configure webhook URLs in your application
3. Test each workflow with sample data

📖 Webhook endpoints:
- Intelligent Q&A: POST $N8N_URL/webhook/intelligent-qa
- Ticket Automation: POST $N8N_URL/webhook/ticket-automation
- Knowledge Extraction: POST $N8N_URL/webhook/knowledge-extract

🔍 Monitoring:
- System monitoring runs every 5 minutes
- Weekly reports are generated every Monday at 9 AM
- Check n8n execution logs for any issues

EOF

echo "🎯 Deployment completed successfully!"

