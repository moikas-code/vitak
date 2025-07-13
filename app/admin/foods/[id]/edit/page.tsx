"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  vitamin_k_mcg_per_100g: z.number().min(0, "Must be 0 or greater"),
  category: z.enum([
    "vegetables",
    "fruits",
    "proteins",
    "grains",
    "dairy",
    "fats_oils",
    "beverages",
    "other",
  ]),
  common_portion_size_g: z.number().min(0, "Must be 0 or greater"),
  common_portion_name: z.string().min(1, "Portion name is required").max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function EditFoodPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const foodId = params.id as string;
  
  // Fetch existing food data
  const { data: food } = api.admin.get_food_by_id.useQuery({
    id: foodId,
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      vitamin_k_mcg_per_100g: 0,
      category: "vegetables",
      common_portion_size_g: 100,
      common_portion_name: "serving",
    },
  });
  
  // Update form when food data is loaded
  useEffect(() => {
    if (food) {
      form.reset({
        name: food.name,
        vitamin_k_mcg_per_100g: food.vitamin_k_mcg_per_100g,
        category: food.category,
        common_portion_size_g: food.common_portion_size_g,
        common_portion_name: food.common_portion_name,
      });
    }
  }, [food, form]);
  
  const updateMutation = api.admin.update_food.useMutation({
    onSuccess: () => {
      toast({
        title: "Food updated",
        description: "The food item has been updated successfully.",
      });
      router.push("/admin/foods");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: FormData) => {
    await updateMutation.mutateAsync({
      id: foodId,
      ...data,
    });
  };
  
  if (!food) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/foods")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Food</h2>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Spinach, raw" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the name of the food item
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="proteins">Proteins</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="fats_oils">Fats & Oils</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the food category
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="vitamin_k_mcg_per_100g"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vitamin K Content (μg per 100g)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Amount of Vitamin K in micrograms per 100 grams
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="common_portion_size_g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Portion Size (g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Weight in grams
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="common_portion_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portion Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., cup, slice, serving" {...field} />
                  </FormControl>
                  <FormDescription>
                    Common name for the portion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Food"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/foods")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}