import json

ipynb_path = r"C:\Users\dioab\Downloads\Recruitmentdata.ipynb"
with open(ipynb_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for i, cell in enumerate(data.get("cells", [])):
    if cell.get("cell_type") == "code":
        # Look for model training or encoding code
        code_lines = "".join(cell.get("source", []))
        if "recruitment_model" in code_lines or "EducationLevel" in code_lines or "LabelEncoder" in code_lines:
            print(f"--- Code Cell {i} ---")
            print(code_lines)
            print("-" * 40)
