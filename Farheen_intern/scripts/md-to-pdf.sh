#!/bin/bash
# Simple script to convert the project Markdown SDD to PDF using pandoc
INPUT=Collaborative_Kanban_Board_Project_Documentation.md
OUTPUT=Collaborative_Kanban_Board_Project_Documentation.pdf
if ! command -v pandoc >/dev/null; then
  echo "pandoc is not installed. Install pandoc to continue."
  exit 1
fi
pandoc -s "$INPUT" -o "$OUTPUT" --pdf-engine=wkhtmltopdf
if [ $? -eq 0 ]; then
  echo "PDF generated: $OUTPUT"
else
  echo "PDF generation failed"
fi
