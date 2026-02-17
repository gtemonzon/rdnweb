import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface LegalSection {
  title: string;
  content: string;
}

interface LegalContent {
  sections: LegalSection[];
  last_updated: string;
}

interface ContentSection {
  id: string;
  section_key: string;
  title: string | null;
  content: unknown;
}

const LegalEditor = ({
  privacySection,
  termsSection,
  onSavePrivacy,
  onSaveTerms,
  isSaving,
}: {
  privacySection?: ContentSection;
  termsSection?: ContentSection;
  onSavePrivacy: (content: LegalContent) => void;
  onSaveTerms: (content: LegalContent) => void;
  isSaving: boolean;
}) => {
  const parseContent = (section?: ContentSection): LegalContent => {
    if (section?.content && typeof section.content === "object") {
      const c = section.content as Partial<LegalContent>;
      return {
        sections: c.sections || [{ title: "", content: "" }],
        last_updated: c.last_updated || new Date().toISOString().slice(0, 10),
      };
    }
    return { sections: [{ title: "", content: "" }], last_updated: new Date().toISOString().slice(0, 10) };
  };

  const [privacy, setPrivacy] = useState<LegalContent>(parseContent());
  const [terms, setTerms] = useState<LegalContent>(parseContent());

  useEffect(() => setPrivacy(parseContent(privacySection)), [privacySection]);
  useEffect(() => setTerms(parseContent(termsSection)), [termsSection]);

  const updateSection = (
    setter: React.Dispatch<React.SetStateAction<LegalContent>>,
    index: number,
    field: keyof LegalSection,
    value: string
  ) => {
    setter((prev) => {
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, sections };
    });
  };

  const addSection = (setter: React.Dispatch<React.SetStateAction<LegalContent>>) => {
    setter((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: "", content: "" }],
    }));
  };

  const removeSection = (setter: React.Dispatch<React.SetStateAction<LegalContent>>, index: number) => {
    setter((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const renderEditor = (
    title: string,
    description: string,
    data: LegalContent,
    setter: React.Dispatch<React.SetStateAction<LegalContent>>,
    onSave: (content: LegalContent) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.sections.map((section, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}.</span>
              <input
                className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="Título de la sección (ej: Identidad del Responsable)"
                value={section.title}
                onChange={(e) => updateSection(setter, index, "title", e.target.value)}
              />
              {data.sections.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeSection(setter, index)}>
                  Eliminar
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Contenido de la sección..."
              value={section.content}
              onChange={(e) => updateSection(setter, index, "content", e.target.value)}
              rows={4}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => addSection(setter)}>
            + Agregar Sección
          </Button>
          <Button
            onClick={() => onSave({ ...data, last_updated: new Date().toISOString().slice(0, 10) })}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderEditor(
        "Política de Privacidad",
        "Contenido de la página /privacidad. Cada sección se numera automáticamente.",
        privacy,
        setPrivacy,
        onSavePrivacy
      )}
      {renderEditor(
        "Términos y Condiciones de Uso",
        "Contenido de la página /terminos. Cada sección se numera automáticamente.",
        terms,
        setTerms,
        onSaveTerms
      )}
    </div>
  );
};

export default LegalEditor;
