import PyPDF2

pdf_path = "c:\\new projects\\workflow\\Quantixone_Backend_Assignment.pdf"
try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(text[:2000]) # print first 2000 chars
        print("---")
        # Search for execution logs
        if "execution" in text.lower() or "log" in text.lower():
            import re
            matches = re.finditer(r'.{0,100}execution.{0,100}', text, re.IGNORECASE | re.DOTALL)
            for i, match in enumerate(matches):
                if i > 5: break
                print(f"Match {i+1}: {match.group(0).strip()}")
except Exception as e:
    print(f"Error reading PDF: {e}")
