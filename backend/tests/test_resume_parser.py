import io
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from applications.resume_parser import extract_text_from_pdf_stream, parse_uploaded_resume
from pypdf import PdfWriter

class ResumeParserTests(TestCase):
    def test_plain_text_resume_parsing(self):
        text_content = b"John Doe\nSoftware Engineer\nSkills: Python, Django, Docker, Kubernetes"
        uploaded = SimpleUploadedFile("resume.txt", text_content, content_type="text/plain")
        result = parse_uploaded_resume(uploaded)
        
        self.assertEqual(result['filename'], 'resume.txt')
        self.assertIn("Python, Django", result['extracted_text'])
        self.assertGreater(result['word_count'], 5)

    def test_pdf_resume_parsing(self):
        # Generate a small in-memory test PDF
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        stream = io.BytesIO()
        writer.write(stream)
        stream.seek(0)

        uploaded = SimpleUploadedFile("test_resume.pdf", stream.read(), content_type="application/pdf")
        result = parse_uploaded_resume(uploaded)
        
        self.assertEqual(result['filename'], 'test_resume.pdf')
        self.assertEqual(result['file_extension'], 'pdf')
