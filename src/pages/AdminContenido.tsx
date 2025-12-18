import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

interface StatItem {
  number: string;
  label: string;
}

interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface ContentSection {
  id: string;
  section_key: string;
  title: string | null;
  content: unknown;
}

const AdminContenido = () => {
  const { user, userRole, hasPermission, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const canManageContent = userRole === "admin" || hasPermission("content", "can_edit_all");

  const { data: contentSections, isLoading } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("section_key");
      if (error) throw error;
      return data as ContentSection[];
    },
    enabled: canManageContent,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ sectionKey, content }: { sectionKey: string; content: Json }) => {
      const { error } = await supabase
        .from("site_content")
        .update({ content, updated_by: user?.id })
        .eq("section_key", sectionKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Contenido actualizado correctamente");
    },
    onError: () => {
      toast.error("Error al actualizar el contenido");
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !canManageContent) {
    return <Navigate to="/admin" replace />;
  }

  const getSection = (key: string) => contentSections?.find(s => s.section_key === key);

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Gestión de Contenido
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra el contenido estático del sitio web
          </p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="mission">Misión/Visión</TabsTrigger>
            <TabsTrigger value="values">Valores</TabsTrigger>
            <TabsTrigger value="timeline">Historia</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsEditor 
              section={getSection("home_stats")} 
              onSave={(content) => updateMutation.mutate({ sectionKey: "home_stats", content: JSON.parse(JSON.stringify(content)) })}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="mission">
            <MissionVisionEditor 
              missionSection={getSection("mission")}
              visionSection={getSection("vision")}
              onSaveMission={(content) => updateMutation.mutate({ sectionKey: "mission", content: JSON.parse(JSON.stringify(content)) })}
              onSaveVision={(content) => updateMutation.mutate({ sectionKey: "vision", content: JSON.parse(JSON.stringify(content)) })}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="values">
            <ValuesEditor 
              section={getSection("values")} 
              onSave={(content) => updateMutation.mutate({ sectionKey: "values", content: JSON.parse(JSON.stringify(content)) })}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineEditor 
              section={getSection("timeline")} 
              onSave={(content) => updateMutation.mutate({ sectionKey: "timeline", content: JSON.parse(JSON.stringify(content)) })}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="contact">
            <ContactEditor 
              section={getSection("contact_info")} 
              onSave={(content) => updateMutation.mutate({ sectionKey: "contact_info", content: JSON.parse(JSON.stringify(content)) })}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Stats Editor Component
const StatsEditor = ({ 
  section, 
  onSave, 
  isSaving 
}: { 
  section?: ContentSection; 
  onSave: (content: StatItem[]) => void;
  isSaving: boolean;
}) => {
  const [stats, setStats] = useState<StatItem[]>([{ number: "", label: "" }]);

  useEffect(() => {
    if (section?.content && Array.isArray(section.content)) {
      setStats(section.content as StatItem[]);
    }
  }, [section]);

  const addStat = () => setStats([...stats, { number: "", label: "" }]);
  const removeStat = (index: number) => setStats(stats.filter((_, i) => i !== index));
  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const newStats = [...stats];
    newStats[index][field] = value;
    setStats(newStats);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas de la Página Principal</CardTitle>
        <CardDescription>Números destacados que se muestran en la página de inicio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex gap-4 items-start">
            <Input
              placeholder="Número (ej: 30+)"
              value={stat.number}
              onChange={(e) => updateStat(index, "number", e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="Etiqueta"
              value={stat.label}
              onChange={(e) => updateStat(index, "label", e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => removeStat(index)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addStat}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Estadística
          </Button>
          <Button onClick={() => onSave(stats)} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Mission/Vision Editor Component
const MissionVisionEditor = ({ 
  missionSection, 
  visionSection, 
  onSaveMission,
  onSaveVision,
  isSaving 
}: { 
  missionSection?: ContentSection; 
  visionSection?: ContentSection;
  onSaveMission: (content: { text: string; image_url?: string }) => void;
  onSaveVision: (content: { text: string; image_url?: string }) => void;
  isSaving: boolean;
}) => {
  const getMissionContent = () => {
    if (missionSection?.content && typeof missionSection.content === 'object') {
      const content = missionSection.content as { text?: string; image_url?: string };
      return { 
        text: content.text || "", 
        image_url: content.image_url || "" 
      };
    }
    return { text: "", image_url: "" };
  };

  const getVisionContent = () => {
    if (visionSection?.content && typeof visionSection.content === 'object') {
      const content = visionSection.content as { text?: string; image_url?: string };
      return { 
        text: content.text || "", 
        image_url: content.image_url || "" 
      };
    }
    return { text: "", image_url: "" };
  };

  const [mission, setMission] = useState("");
  const [missionImage, setMissionImage] = useState("");
  const [vision, setVision] = useState("");
  const [visionImage, setVisionImage] = useState("");

  useEffect(() => {
    const content = getMissionContent();
    setMission(content.text);
    setMissionImage(content.image_url);
  }, [missionSection]);

  useEffect(() => {
    const content = getVisionContent();
    setVision(content.text);
    setVisionImage(content.image_url);
  }, [visionSection]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Misión</CardTitle>
          <CardDescription>El propósito fundamental de la organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={4}
            placeholder="Escribe la misión de la organización..."
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">URL de Imagen</label>
            <Input
              value={missionImage}
              onChange={(e) => setMissionImage(e.target.value)}
              placeholder="https://ejemplo.com/imagen-mision.jpg"
            />
            {missionImage && (
              <div className="mt-3 rounded-lg overflow-hidden max-w-xs">
                <img src={missionImage} alt="Vista previa" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>
          <Button onClick={() => onSaveMission({ text: mission, image_url: missionImage })} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Misión
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visión</CardTitle>
          <CardDescription>El futuro al que aspira la organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={4}
            placeholder="Escribe la visión de la organización..."
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">URL de Imagen</label>
            <Input
              value={visionImage}
              onChange={(e) => setVisionImage(e.target.value)}
              placeholder="https://ejemplo.com/imagen-vision.jpg"
            />
            {visionImage && (
              <div className="mt-3 rounded-lg overflow-hidden max-w-xs">
                <img src={visionImage} alt="Vista previa" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>
          <Button onClick={() => onSaveVision({ text: vision, image_url: visionImage })} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Visión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Values Editor Component
const ValuesEditor = ({ 
  section, 
  onSave, 
  isSaving 
}: { 
  section?: ContentSection; 
  onSave: (content: ValueItem[]) => void;
  isSaving: boolean;
}) => {
  const [values, setValues] = useState<ValueItem[]>([{ icon: "Heart", title: "", description: "" }]);

  useEffect(() => {
    if (section?.content && Array.isArray(section.content)) {
      setValues(section.content as ValueItem[]);
    }
  }, [section]);

  const iconOptions = ["Heart", "Shield", "Users", "Star", "Award", "Target", "Eye", "BookOpen"];

  const addValue = () => setValues([...values, { icon: "Heart", title: "", description: "" }]);
  const removeValue = (index: number) => setValues(values.filter((_, i) => i !== index));
  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    const newValues = [...values];
    newValues[index][field] = value;
    setValues(newValues);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores Institucionales</CardTitle>
        <CardDescription>Los principios que guían la organización</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {values.map((value, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-4">
              <select
                value={value.icon}
                onChange={(e) => updateValue(index, "icon", e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <Input
                placeholder="Título"
                value={value.title}
                onChange={(e) => updateValue(index, "title", e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeValue(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              placeholder="Descripción"
              value={value.description}
              onChange={(e) => updateValue(index, "description", e.target.value)}
              rows={2}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addValue}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Valor
          </Button>
          <Button onClick={() => onSave(values)} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Timeline Editor Component
const TimelineEditor = ({ 
  section, 
  onSave, 
  isSaving 
}: { 
  section?: ContentSection; 
  onSave: (content: TimelineItem[]) => void;
  isSaving: boolean;
}) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([{ year: "", title: "", description: "" }]);

  useEffect(() => {
    if (section?.content && Array.isArray(section.content)) {
      setTimeline(section.content as TimelineItem[]);
    }
  }, [section]);

  const addItem = () => setTimeline([...timeline, { year: "", title: "", description: "" }]);
  const removeItem = (index: number) => setTimeline(timeline.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof TimelineItem, value: string) => {
    const newTimeline = [...timeline];
    newTimeline[index][field] = value;
    setTimeline(newTimeline);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia / Línea de Tiempo</CardTitle>
        <CardDescription>Los hitos más importantes de la organización</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-4">
              <Input
                placeholder="Año"
                value={item.year}
                onChange={(e) => updateItem(index, "year", e.target.value)}
                className="w-24"
              />
              <Input
                placeholder="Título"
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              placeholder="Descripción"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              rows={2}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Evento
          </Button>
          <Button onClick={() => onSave(timeline)} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ContactInfo {
  address: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  schedule: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

// Contact Editor Component
const ContactEditor = ({ 
  section, 
  onSave, 
  isSaving 
}: { 
  section?: ContentSection; 
  onSave: (content: ContactInfo) => void;
  isSaving: boolean;
}) => {
  const getContactInfo = (): ContactInfo => {
    if (section?.content && typeof section.content === 'object') {
      const content = section.content as Partial<ContactInfo>;
      return {
        address: content.address || "",
        phone: content.phone || "",
        phone2: content.phone2 || "",
        email: content.email || "",
        email2: content.email2 || "",
        schedule: content.schedule || "",
        facebook: content.facebook || "",
        instagram: content.instagram || "",
        twitter: content.twitter || "",
        youtube: content.youtube || "",
      };
    }
    return {
      address: "", phone: "", phone2: "", email: "", email2: "",
      schedule: "", facebook: "", instagram: "", twitter: "", youtube: ""
    };
  };

  const [contact, setContact] = useState<ContactInfo>(getContactInfo);

  useEffect(() => {
    setContact(getContactInfo());
  }, [section]);

  const updateField = (field: keyof ContactInfo, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
          <CardDescription>Datos de contacto que se muestran en el pie de página y página de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Dirección</label>
              <Textarea
                value={contact.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="4ta avenida 10-53 zona 9 Ciudad de Guatemala"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Horario</label>
              <Input
                value={contact.schedule}
                onChange={(e) => updateField("schedule", e.target.value)}
                placeholder="Lunes a Viernes, 9:00 AM - 4:00 PM"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Teléfono Principal</label>
              <Input
                value={contact.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+502 2200-0000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Teléfono Secundario</label>
              <Input
                value={contact.phone2}
                onChange={(e) => updateField("phone2", e.target.value)}
                placeholder="+502 2200-0001"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email Principal</label>
              <Input
                value={contact.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="info@refugiodelaninez.org"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email Secundario</label>
              <Input
                value={contact.email2}
                onChange={(e) => updateField("email2", e.target.value)}
                placeholder="donaciones@refugiodelaninez.org"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
          <CardDescription>Enlaces a las redes sociales de la organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Facebook</label>
              <Input
                value={contact.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Instagram</label>
              <Input
                value={contact.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Twitter/X</label>
              <Input
                value={contact.twitter}
                onChange={(e) => updateField("twitter", e.target.value)}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">YouTube</label>
              <Input
                value={contact.youtube}
                onChange={(e) => updateField("youtube", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
          <Button onClick={() => onSave(contact)} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Información de Contacto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContenido;
