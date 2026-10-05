import io
import re
from pypdf import PdfReader

def extract_text_from_pdf_stream(stream) -> str:
    """
    Extracts raw text content from a PDF file stream or bytes object.
    Supports in-memory file uploads (InMemoryUploadedFile, TemporaryUploadedFile, bytes).
    """
    try:
        if isinstance(stream, bytes):
            stream = io.BytesIO(stream)
        elif hasattr(stream, 'read'):
            stream.seek(0)
            content = stream.read()
            stream.seek(0)
            if isinstance(content, bytes):
                stream = io.BytesIO(content)
            else:
                return str(content)

        reader = PdfReader(stream)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        extracted = "\n".join(text_parts).strip()
        # Clean up excessive whitespace
        cleaned = re.sub(r'[ \t]+', ' ', extracted)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned
    except Exception as e:
        print(f"[ResumeParser] Error reading PDF: {e}")
        return ""

def parse_uploaded_resume(uploaded_file) -> dict:
    """
    Parses an uploaded resume file and returns extracted text and metadata.
    """
    filename = getattr(uploaded_file, 'name', '') or 'resume.pdf'
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    extracted_text = ""
    if ext == 'pdf':
        extracted_text = extract_text_from_pdf_stream(uploaded_file)
    else:
        try:
            if hasattr(uploaded_file, 'read'):
                uploaded_file.seek(0)
                raw = uploaded_file.read()
                uploaded_file.seek(0)
                extracted_text = raw.decode('utf-8', errors='ignore') if isinstance(raw, bytes) else str(raw)
        except Exception as e:
            print(f"[ResumeParser] Plain text read error: {e}")

    return {
        'filename': filename,
        'file_extension': ext,
        'extracted_text': extracted_text,
        'character_count': len(extracted_text),
        'word_count': len(extracted_text.split()) if extracted_text else 0
    }
