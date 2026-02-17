import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const FaqEditor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", display_order: 0 });
  const [showNew, setShowNew] = useState(false);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as FaqItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (faq: { question: string; answer: string; display_order: number }) => {
      const { error } = await supabase.from("faqs").insert({
        ...faq,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("Pregunta creada");
      setShowNew(false);
      setNewFaq({ question: "", answer: "", display_order: 0 });
    },
    onError: () => toast.error("Error al crear la pregunta"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FaqItem> & { id: string }) => {
      const { error } = await supabase.from("faqs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("Pregunta actualizada");
      setEditingId(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("Pregunta eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const handleCreate = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error("La pregunta y respuesta son requeridas");
      return;
    }
    const nextOrder = faqs ? Math.max(...faqs.map((f) => f.display_order), 0) + 1 : 1;
    createMutation.mutate({ ...newFaq, display_order: nextOrder });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>Administra las preguntas frecuentes del sitio</CardDescription>
          </div>
          <Button onClick={() => setShowNew(true)} disabled={showNew}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Pregunta
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New FAQ form */}
        {showNew && (
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 space-y-3 bg-muted/50">
            <Input
              placeholder="Pregunta"
              value={newFaq.question}
              onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
            />
            <Textarea
              placeholder="Respuesta"
              value={newFaq.answer}
              onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} size="sm">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Existing FAQs */}
        {faqs && faqs.length === 0 && !showNew && (
          <p className="text-center text-muted-foreground py-8">No hay preguntas frecuentes. Crea la primera.</p>
        )}

        {faqs?.map((faq) => (
          <FaqRow
            key={faq.id}
            faq={faq}
            isEditing={editingId === faq.id}
            onEdit={() => setEditingId(faq.id)}
            onCancel={() => setEditingId(null)}
            onSave={(updates) => updateMutation.mutate({ id: faq.id, ...updates })}
            onDelete={() => {
              if (confirm("¿Eliminar esta pregunta?")) deleteMutation.mutate(faq.id);
            }}
            onToggleActive={(active) => updateMutation.mutate({ id: faq.id, is_active: active })}
            isSaving={updateMutation.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
};

interface FaqRowProps {
  faq: FaqItem;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<FaqItem>) => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
  isSaving: boolean;
}

const FaqRow = ({ faq, isEditing, onEdit, onCancel, onSave, onDelete, onToggleActive, isSaving }: FaqRowProps) => {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [order, setOrder] = useState(faq.display_order);

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pregunta" />
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Respuesta" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Orden:</label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-20"
            />
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={() => onSave({ question, answer, display_order: order })} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 flex items-start gap-3 group hover:bg-muted/30 transition-colors">
      <GripVertical className="w-4 h-4 mt-1 text-muted-foreground/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-mono">#{faq.display_order}</span>
          {!faq.is_active && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactiva</span>
          )}
        </div>
        <p className="font-medium text-foreground text-sm">{faq.question}</p>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch checked={faq.is_active} onCheckedChange={onToggleActive} />
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default FaqEditor;
