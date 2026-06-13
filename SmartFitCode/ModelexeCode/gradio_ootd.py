import sys
from pathlib import Path

# Fix Python path
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

PROJECT_ROOT = Path(__file__).absolute().parents[1].absolute()
sys.path.insert(0, str(PROJECT_ROOT))

# Now import libraries
import gradio as gr
import os
import torch
from PIL import Image

from utils_ootd import get_mask_location
from preprocess.openpose.run_openpose import OpenPose
from preprocess.humanparsing.run_parsing import Parsing
from ootd.inference_ootd_dc import OOTDiffusionDC

# ---------------------------
# GLOBAL MODEL (Lazy Loaded)
# ---------------------------

openpose_model = None
parsing_model = None
ootd_model = None

category_dict = ['upperbody', 'lowerbody', 'dress']
category_dict_utils = ['upper_body', 'lower_body', 'dresses']

# ---------------------------
# Lazy Load Function
# ---------------------------

def load_models():
    global openpose_model, parsing_model, ootd_model
    
    if openpose_model is None:
        print("Loading OpenPose...")
        openpose_model = OpenPose(0)

    if parsing_model is None:
        print("Loading Parsing...")
        parsing_model = Parsing(0)

    if ootd_model is None:
        print("Loading OOTDiffusion DC Model...")
        ootd_model = OOTDiffusionDC(0)

# ---------------------------
# Main Processing Function
# ---------------------------

def process_fullbody(vton_img, garm_img, category, n_samples, n_steps, image_scale, seed):

    load_models()

    if category == "Upper-body":
        category_idx = 0
    elif category == "Lower-body":
        category_idx = 1
    else:
        category_idx = 2

    with torch.no_grad():

        garm_img = Image.open(garm_img).resize((768, 1024))
        vton_img = Image.open(vton_img).resize((768, 1024))

        keypoints = openpose_model(vton_img.resize((384, 512)))
        model_parse, _ = parsing_model(vton_img.resize((384, 512)))

        mask, mask_gray = get_mask_location(
            'dc',
            category_dict_utils[category_idx],
            model_parse,
            keypoints
        )

        mask = mask.resize((768, 1024), Image.NEAREST)
        mask_gray = mask_gray.resize((768, 1024), Image.NEAREST)

        masked_vton_img = Image.composite(mask_gray, vton_img, mask)

        images = ootd_model(
            model_type='dc',
            category=category_dict[category_idx],
            image_garm=garm_img,
            image_vton=masked_vton_img,
            mask=mask,
            image_ori=vton_img,
            num_samples=n_samples,
            num_steps=n_steps,
            image_scale=image_scale,
            seed=seed,
        )

    torch.cuda.empty_cache()

    return images

# ---------------------------
# Gradio UI
# ---------------------------

with gr.Blocks(title="FashioLens – AI Virtual Try-On") as app:

    gr.Markdown("# 👗 FashioLens – AI Virtual Try-On")
    gr.Markdown("### Full-Body Virtual Try-On Experience")

    with gr.Row():
        with gr.Column():
            vton_img = gr.Image(
                label="Upload Model Image",
                sources="upload",
                type="filepath",
                height=400,
            )

        with gr.Column():
            garm_img = gr.Image(
                label="Upload Garment Image",
                sources="upload",
                type="filepath",
                height=400,
            )

    category = gr.Dropdown(
        label="Garment Category",
        choices=["Upper-body", "Lower-body", "Dress"],
        value="Upper-body"
    )

    run_button = gr.Button("✨ Generate Try-On")

    with gr.Row():
        n_samples = gr.Slider(label="Images", minimum=1, maximum=2, value=1, step=1)
        n_steps = gr.Slider(label="Steps", minimum=15, maximum=25, value=20, step=1)
        image_scale = gr.Slider(label="Guidance Scale", minimum=1.0, maximum=4.0, value=2.0, step=0.1)
        seed = gr.Slider(label="Seed", minimum=-1, maximum=2147483647, value=-1, step=1)

    result_gallery = gr.Gallery(
        label="Generated Output",
        show_label=True,
        columns=2,
        height=500
    )

    run_button.click(
        fn=process_fullbody,
        inputs=[vton_img, garm_img, category, n_samples, n_steps, image_scale, seed],
        outputs=result_gallery
    )

app.launch()