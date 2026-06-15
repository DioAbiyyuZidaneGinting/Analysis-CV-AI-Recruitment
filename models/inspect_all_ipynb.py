import json

ipynb_path = r"C:\Users\dioab\Downloads\Recruitmentdata.ipynb"
with open(ipynb_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for i, cell in enumerate(data.get("cells", [])):
    if cell.get("cell_type") == "code":
        code_lines = "".join(cell.get("source", []))
        print(f"--- Code Cell {i} ---")
        print(code_lines)
        # also print outputs if present
        outputs = cell.get("outputs", [])
        for out in outputs:
            if out.get("output_type") == "stream":
                print("Output:", "".join(out.get("text", [])))
            elif out.get("output_type") == "execute_result":
                print("Result:", "".join(out.get("data", {}).get("text/plain", [])))
        print("-" * 60)
