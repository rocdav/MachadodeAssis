import gradio as gr

def display_map(view_type):
    if view_type == "Map 1":
        url = "https://glistening-creponne-55fbb0.netlify.app"
    elif view_type == "Map 2":
        url = "https://sprightly-heliotrope-a6037e.netlify.app"
    elif view_type == "Map 3":
        url = "https://lively-lolly-e332aa.netlify.app"
    elif view_type == "Map 4":
        url = "https://frolicking-blancmange-bdfba9.netlify.app/"
    elif view_type == "Map 5":
        url = "https://marvelous-bonbon-a1949f.netlify.app"
    else:
        url = ""
    
    iframe = f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'
    return iframe

view_type = gr.inputs.Radio(["Map 1", "Map 2", "Map 3", "Map 4", "Map 5"], label="Selecione a visão do mapa")

iface = gr.Interface(fn=display_map, inputs=view_type, outputs="html", live=True)
iface.launch()
